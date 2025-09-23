import { test, expect } from '@playwright/test'

test.describe('Hand Evaluation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MTT Poker Solver/)
  })

  test('should evaluate a royal flush correctly', async ({ page }) => {
    // Navigate to hand analyzer
    await page.click('nav >> text=Hand Analyzer')
    await expect(page.locator('h1')).toContainText('Hand Analyzer')

    // Select cards for royal flush
    const royalFlushCards = [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'spades' },
      { rank: 'Q', suit: 'spades' },
      { rank: 'J', suit: 'spades' },
      { rank: 'T', suit: 'spades' }
    ]

    for (const card of royalFlushCards) {
      await page.click(`[aria-label="${card.rank} of ${card.suit}"]`)
    }

    // Verify card selection count
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('5 / 7')

    // Evaluate hand
    await page.click('button:has-text("Evaluate Hand")')

    // Wait for results
    await expect(page.locator('[data-testid="hand-result"]')).toBeVisible({ timeout: 10000 })

    // Verify royal flush result
    await expect(page.locator('[data-testid="hand-rank"]')).toContainText('10')
    await expect(page.locator('[data-testid="hand-description"]')).toContainText('Royal Flush')
    await expect(page.locator('[data-testid="hand-category"]')).toContainText('ROYAL_FLUSH')

    // Verify visual feedback
    await expect(page.locator('[data-testid="hand-strength-meter"]')).toHaveClass(/strength-10/)

    // Check if animation played
    await expect(page.locator('[data-testid="celebration-animation"]')).toBeVisible()
  })

  test('should handle 7-card hand evaluation (Texas Hold\'em)', async ({ page }) => {
    await page.click('nav >> text=Hand Analyzer')

    // Select hole cards
    await page.click('[aria-label="A of spades"]')
    await page.click('[aria-label="K of hearts"]')

    // Select board cards
    await page.click('[aria-label="A of diamonds"]')
    await page.click('[aria-label="K of clubs"]')
    await page.click('[aria-label="Q of spades"]')
    await page.click('[aria-label="J of hearts"]')
    await page.click('[aria-label="T of diamonds"]')

    // Verify 7 cards selected
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('7 / 7')

    // Evaluate
    await page.click('button:has-text("Evaluate Hand")')

    // Should find the straight (best 5-card hand)
    await expect(page.locator('[data-testid="hand-description"]')).toContainText('Straight')
    await expect(page.locator('[data-testid="best-hand-cards"]')).toBeVisible()

    // Verify best 5 cards are highlighted
    const bestHandCards = page.locator('[data-testid="best-hand-card"]')
    await expect(bestHandCards).toHaveCount(5)
  })

  test('should calculate equity between two hands', async ({ page }) => {
    await page.click('nav >> text=Hand Analyzer')

    // Enable equity calculation mode
    await page.click('[data-testid="equity-mode-toggle"]')

    // Select hand 1 (pocket aces)
    await page.locator('[data-testid="hand1-section"]').click()
    await page.click('[aria-label="A of spades"]')
    await page.click('[aria-label="A of hearts"]')

    // Select hand 2 (2-7 offsuit)
    await page.locator('[data-testid="hand2-section"]').click()
    await page.click('[aria-label="2 of clubs"]')
    await page.click('[aria-label="7 of diamonds"]')

    // Set simulation parameters
    await page.fill('[data-testid="iterations-input"]', '10000')

    // Calculate equity
    await page.click('button:has-text("Calculate Equity")')

    // Wait for calculation
    await expect(page.locator('[data-testid="calculation-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="equity-results"]')).toBeVisible({ timeout: 30000 })

    // Verify results
    const hand1Equity = await page.locator('[data-testid="hand1-equity"]').textContent()
    const hand1EquityNum = parseFloat(hand1Equity?.replace('%', '') || '0')

    expect(hand1EquityNum).toBeGreaterThan(80) // AA should win ~87% vs 27o
    expect(hand1EquityNum).toBeLessThan(95)

    // Verify equity visualization
    await expect(page.locator('[data-testid="equity-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="equity-breakdown"]')).toBeVisible()
  })

  test('should handle invalid hand selections', async ({ page }) => {
    await page.click('nav >> text=Hand Analyzer')

    // Try to evaluate with no cards
    await page.click('button:has-text("Evaluate Hand")')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('at least 5 cards')

    // Select only 3 cards
    await page.click('[aria-label="A of spades"]')
    await page.click('[aria-label="K of hearts"]')
    await page.click('[aria-label="Q of diamonds"]')

    await page.click('button:has-text("Evaluate Hand")')

    // Should still show error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('at least 5 cards')

    // Try to select duplicate cards (should be prevented)
    await page.click('[aria-label="A of spades"]') // Already selected

    // Should not increase count
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('3 / 7')
  })

  test('should save and load hand history', async ({ page }) => {
    await page.click('nav >> text=Hand Analyzer')

    // Evaluate a hand
    await page.click('[aria-label="A of spades"]')
    await page.click('[aria-label="A of hearts"]')
    await page.click('[aria-label="K of clubs"]')
    await page.click('[aria-label="K of diamonds"]')
    await page.click('[aria-label="Q of spades"]')

    await page.click('button:has-text("Evaluate Hand")')
    await expect(page.locator('[data-testid="hand-result"]')).toBeVisible()

    // Save hand
    await page.click('button:has-text("Save Hand")')
    await page.fill('[data-testid="hand-name-input"]', 'Test Two Pair')
    await page.click('button:has-text("Save")')

    // Check history
    await page.click('[data-testid="history-tab"]')
    await expect(page.locator('[data-testid="history-item"]')).toContainText('Test Two Pair')

    // Load saved hand
    await page.click('[data-testid="load-hand-btn"]')

    // Verify cards are loaded
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('5 / 7')
    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(5)
  })

  test('should work correctly on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')

    await page.goto('/')

    // Check responsive navigation
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()

    await page.click('text=Hand Analyzer')
    await expect(page.locator('h1')).toContainText('Hand Analyzer')

    // Test touch interactions
    await page.tap('[aria-label="A of spades"]')
    await page.tap('[aria-label="K of hearts"]')

    // Verify mobile layout
    await expect(page.locator('[data-testid="card-grid"]')).toHaveClass(/mobile-grid/)

    // Test swipe gestures (if implemented)
    await page.locator('[data-testid="card-grid"]').swipe([0, 0], [100, 0])
  })

  test('should provide accessibility features', async ({ page }) => {
    await page.click('nav >> text=Hand Analyzer')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    // Navigate to cards with arrow keys
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    // Select card with Enter
    await page.keyboard.press('Enter')
    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(1)

    // Test screen reader support
    const firstCard = page.locator('[aria-label*="of spades"]').first()
    await expect(firstCard).toHaveAttribute('role', 'button')
    await expect(firstCard).toHaveAttribute('tabindex', '0')

    // Test focus management
    await page.click('button:has-text("Clear All")')
    await expect(page.locator('[data-testid="clear-all-btn"]')).toBeFocused()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await page.click('nav >> text=Hand Analyzer')

    // Simulate network failure
    await page.route('**/api/hands/evaluate', route => {
      route.abort('failed')
    })

    // Select cards and try to evaluate
    await page.click('[aria-label="A of spades"]')
    await page.click('[aria-label="K of hearts"]')
    await page.click('[aria-label="Q of diamonds"]')
    await page.click('[aria-label="J of clubs"]')
    await page.click('[aria-label="T of spades"]')

    await page.click('button:has-text("Evaluate Hand")')

    // Should show error message
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

    // Test retry functionality
    await page.unroute('**/api/hands/evaluate')
    await page.click('[data-testid="retry-button"]')

    // Should succeed on retry
    await expect(page.locator('[data-testid="hand-result"]')).toBeVisible({ timeout: 10000 })
  })

  test('should show performance metrics', async ({ page }) => {
    await page.click('nav >> text=Hand Analyzer')

    // Enable performance monitoring
    await page.click('[data-testid="settings-menu"]')
    await page.check('[data-testid="show-performance"]')

    // Evaluate hand
    await page.click('[aria-label="A of spades"]')
    await page.click('[aria-label="K of hearts"]')
    await page.click('[aria-label="Q of diamonds"]')
    await page.click('[aria-label="J of clubs"]')
    await page.click('[aria-label="T of spades"]')

    await page.click('button:has-text("Evaluate Hand")')

    // Check performance metrics
    await expect(page.locator('[data-testid="evaluation-time"]')).toBeVisible()
    await expect(page.locator('[data-testid="api-response-time"]')).toBeVisible()

    // Verify performance is within acceptable range
    const evaluationTime = await page.locator('[data-testid="evaluation-time"]').textContent()
    const timeMs = parseFloat(evaluationTime?.replace('ms', '') || '0')

    expect(timeMs).toBeLessThan(100) // Should evaluate in under 100ms
  })
})