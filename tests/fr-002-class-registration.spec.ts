import { expect, test } from '@playwright/test'

test('member can view an available class and register', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email or phone').fill('member@sports-center.local')
  await page.getByLabel('Password').fill('ChangeMe123!')
  await page.getByRole('button', { name: /Continue/ }).click()

  await expect(page.getByRole('heading', { name: 'Chọn lớp cho buổi tập tiếp theo.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Functional Strength' })).toBeVisible()
  await page.getByRole('article').filter({ hasText: 'Functional Strength' }).getByRole('button', { name: 'Đăng ký' }).click()
  await expect(page.getByRole('status')).toContainText('Đăng ký lớp học thành công')
})
