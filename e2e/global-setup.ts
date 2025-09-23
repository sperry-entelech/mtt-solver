import { chromium, FullConfig } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')

  // Setup test database
  console.log('📊 Setting up test database...')
  try {
    await execAsync('npm run db:test:reset', { cwd: '../backend' })
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }

  // Seed test data
  console.log('🌱 Seeding test data...')
  try {
    await execAsync('npm run db:test:seed', { cwd: '../backend' })
    console.log('✅ Test data seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed test data:', error)
    throw error
  }

  // Clear Redis cache
  console.log('🗑️ Clearing cache...')
  try {
    await execAsync('npm run cache:clear', { cwd: '../backend' })
    console.log('✅ Cache cleared')
  } catch (error) {
    console.warn('⚠️ Failed to clear cache (non-critical):', error)
  }

  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...')
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Check backend health
  let backendReady = false
  let attempts = 0
  const maxAttempts = 30

  while (!backendReady && attempts < maxAttempts) {
    try {
      const response = await page.goto('http://localhost:3001/health', {
        waitUntil: 'networkidle',
        timeout: 5000
      })

      if (response?.status() === 200) {
        const health = await response.json()
        if (health.status === 'ok') {
          backendReady = true
          console.log('✅ Backend service is ready')
        }
      }
    } catch (error) {
      attempts++
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Check frontend
  let frontendReady = false
  attempts = 0

  while (!frontendReady && attempts < maxAttempts) {
    try {
      const response = await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 5000
      })

      if (response?.status() === 200) {
        frontendReady = true
        console.log('✅ Frontend service is ready')
      }
    } catch (error) {
      attempts++
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  await browser.close()

  if (!backendReady || !frontendReady) {
    throw new Error('Services failed to start within timeout period')
  }

  // Create test users and sessions
  console.log('👤 Creating test users...')
  try {
    await execAsync('npm run test:create-users', { cwd: '../backend' })
    console.log('✅ Test users created')
  } catch (error) {
    console.warn('⚠️ Failed to create test users (non-critical):', error)
  }

  console.log('🎉 E2E test setup complete!')
}

export default globalSetup