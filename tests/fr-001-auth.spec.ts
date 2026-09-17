import { expect, test } from '@playwright/test'

test('member can sign in and see the role dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sign in to your center' })).toBeVisible()
  await page.getByLabel('Email or phone').fill('manager@sports-center.local')
  await page.getByLabel('Password').fill('ChangeMe123!')
  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.getByRole('heading', { name: 'Chào mừng, Center Manager' })).toBeVisible()
  await expect(page.getByText('CENTER_MANAGER')).toBeVisible()
})

test('invalid credentials show a clear error', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: /Continue/ }).click()
  await expect(page.getByRole('alert')).toContainText('Email hoặc mật khẩu không đúng')
})
