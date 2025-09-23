import { FullConfig } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...')

  // Clean up test database
  console.log('🗑️ Cleaning up test database...')
  try {
    await execAsync('npm run db:test:cleanup', { cwd: '../backend' })
    console.log('✅ Test database cleaned up')
  } catch (error) {
    console.warn('⚠️ Failed to clean up test database:', error)
  }

  // Clear cache
  console.log('🗑️ Clearing cache...')
  try {
    await execAsync('npm run cache:clear', { cwd: '../backend' })
    console.log('✅ Cache cleared')
  } catch (error) {
    console.warn('⚠️ Failed to clear cache:', error)
  }

  // Remove test files
  console.log('📁 Cleaning up test files...')
  try {
    await execAsync('rm -rf uploads/test-*')
    await execAsync('rm -rf temp/e2e-*')
    console.log('✅ Test files cleaned up')
  } catch (error) {
    console.warn('⚠️ Failed to clean up test files:', error)
  }

  console.log('✅ E2E test teardown complete!')
}

export default globalTeardown