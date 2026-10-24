import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const RAZORPAY_TEST_SECRET = 's9x1W8oH8vQ2wM3L4k5J6i7H';

test.describe('E-Commerce End-to-End User Purchase Flow', () => {
  test('Complete flow: browse catalog -> add to cart -> register -> checkout with Razorpay -> view order', async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // 1. Browse Catalog
    // -------------------------------------------------------------------------
    await page.goto('/');
    await expect(page).toHaveTitle(/SHOPPE/i);

    // Navigate to Shop Catalog
    await page.goto('/shop');
    await expect(page.locator('text=All Products')).toBeVisible({ timeout: 15000 });

    // Locate product links on the shop page
    const productLinks = page.locator('a[href^="/product/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 10000 });

    // Click the first product tile
    await productLinks.first().click();

    // -------------------------------------------------------------------------
    // 2. Product Detail Page & Add to Cart
    // -------------------------------------------------------------------------
    await page.waitForURL(/\/product\/[a-z0-9-]+/, { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible();

    // Add to cart
    const addToCartButton = page.locator('button:has-text("+ Add to Cart")');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // Verify confirmation toast or cart badge
    await expect(page.locator('text=to cart!').first()).toBeVisible({ timeout: 8000 });

    // -------------------------------------------------------------------------
    // 3. User Registration
    // -------------------------------------------------------------------------
    const uniqueId = Date.now();
    const customerEmail = `e2e_buyer_${uniqueId}@example.com`;
    const customerPassword = 'Password123!';
    const customerName = 'Jane E2E Shopper';

    await page.goto('/register');
    await expect(page.locator('h1:has-text("Create an Account")')).toBeVisible();

    await page.fill('input[placeholder="e.g. Sarah Connor"]', customerName);
    await page.fill('input[type="email"]', customerEmail);
    await page.fill('input[placeholder="+91 9876543210"]', '9876543210');
    await page.locator('input[placeholder="••••••••••••"]').first().fill(customerPassword);
    await page.locator('input[placeholder="••••••••••••"]').last().fill(customerPassword);

    await page.click('button:has-text("Create Account")');
    await page.waitForURL('/', { timeout: 15000 });

    // -------------------------------------------------------------------------
    // 4. Cart Page & Proceed to Checkout
    // -------------------------------------------------------------------------
    await page.goto('/cart');
    await expect(page.locator('text=Order Summary')).toBeVisible({ timeout: 10000 });

    const proceedBtn = page.locator('button:has-text("Proceed to Checkout")');
    await expect(proceedBtn).toBeVisible();
    await proceedBtn.click();

    // -------------------------------------------------------------------------
    // 5. Checkout - Step 1: Delivery Address
    // -------------------------------------------------------------------------
    await page.waitForURL('/checkout', { timeout: 15000 });
    await expect(page.locator('h1:has-text("Express Checkout")')).toBeVisible();

    // If address form is displayed, fill in address details
    const fullNameInput = page.locator('input[placeholder="e.g. John Doe"]');
    if (await fullNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fullNameInput.fill(customerName);
      await page.fill('input[placeholder="9876543210"]', '9876543210');
      await page.fill(
        'input[placeholder="House / Flat No., Apartment / Building Name"]',
        '42 Tech Park, Outer Ring Road'
      );
      await page.fill('input[placeholder="Bengaluru"]', 'Bengaluru');
      await page.fill('input[placeholder="Karnataka"]', 'Karnataka');
      await page.fill('input[placeholder="560001"]', '560103');

      const saveAddressBtn = page.locator('button:has-text("Save & Use Address")');
      await saveAddressBtn.click();
      await page.waitForTimeout(500);
    }

    // Advance to Step 2
    const deliverToAddressBtn = page.locator('button:has-text("Deliver to this Address")');
    if (await deliverToAddressBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deliverToAddressBtn.click();
    }

    // -------------------------------------------------------------------------
    // 6. Checkout - Step 2: Shipping Method
    // -------------------------------------------------------------------------
    const continueToPaymentBtn = page.locator('button:has-text("Continue to Payment")');
    await expect(continueToPaymentBtn).toBeVisible({ timeout: 10000 });
    await continueToPaymentBtn.click();

    // -------------------------------------------------------------------------
    // 7. Checkout - Step 3: Payment with Razorpay Test Mode
    // -------------------------------------------------------------------------
    // Expose signature generator helper to the browser page context
    await page.exposeFunction('generateRazorpaySignature', (orderId, paymentId) => {
      return crypto
        .createHmac('sha256', RAZORPAY_TEST_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    });

    // Mock Razorpay SDK modal to simulate instant successful authorization
    await page.evaluate(() => {
      window.Razorpay = function (options) {
        this.open = async function () {
          const testPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 10);
          const signature = await window.generateRazorpaySignature(options.order_id, testPaymentId);
          setTimeout(() => {
            if (options.handler) {
              options.handler({
                razorpay_order_id: options.order_id,
                razorpay_payment_id: testPaymentId,
                razorpay_signature: signature,
              });
            }
          }, 300);
        };
      };
    });

    const payButton = page.locator('button:has-text("via Razorpay")');
    await expect(payButton).toBeVisible();
    await payButton.click();

    // -------------------------------------------------------------------------
    // 8. View Confirmed Order
    // -------------------------------------------------------------------------
    await page.waitForURL(/\/order-success\/[A-Z0-9-]+/, { timeout: 20000 });
    await expect(page.locator('text=Order Placed Successfully!')).toBeVisible();
    await expect(page.locator('text=Order #')).toBeVisible();
  });
});
