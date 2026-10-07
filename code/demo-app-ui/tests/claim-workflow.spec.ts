import { expect, test, type Page } from '@playwright/test';

const claimantEmail = process.env.E2E_CLAIMANT_EMAIL ?? 'claimant@demo.com';
const claimantPassword = process.env.E2E_CLAIMANT_PASSWORD ?? 'Claimant123!';

async function loginAsClaimant(page: Page) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

  await page.getByLabel('Email').fill(claimantEmail);
  await page.getByLabel('Password', { exact: true }).fill(claimantPassword);
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page).toHaveURL(/\/claims$/);
  await expect(page.getByRole('heading', { name: 'My Claims' })).toBeVisible();
}

test('claimant can submit a claim and see it in My Claims', async ({ page }) => {
  const runId = Date.now();
  const incidentDate = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const claimMarker = `E2E-${runId}`;
  const location = `Kuala Lumpur QA test location ${runId}`;
  const description = `${claimMarker} minor vehicle damage on a parked car`;
  const amount = '2500.00';

  await loginAsClaimant(page);

  await page.getByRole('button', { name: 'Submit New Claim' }).click();
  await expect(page).toHaveURL(/\/claims\/new$/);
  await expect(page.getByRole('heading', { name: 'Incident Details' })).toBeVisible();

  await page.getByLabel(/When did the incident occur/).fill(incidentDate);
  await page.getByLabel(/Where did the incident occur/).fill(location);
  await page.getByLabel(/Claim Amount/).fill(amount);
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Supporting Details' })).toBeVisible();
  await page.getByLabel(/Describe what happened/).fill(description);
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  const reviewStep = page
    .getByRole('heading', { name: 'Review Your Claim' })
    .locator('..');
  await expect(reviewStep).toBeVisible();
  await expect(page.getByText(location)).toBeVisible();
  await expect(page.getByText(description)).toBeVisible();
  await expect(page.getByText('$2,500.00')).toBeVisible();

  const createClaimResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/claims') &&
      response.request().method() === 'POST'
  );
  await reviewStep.getByRole('button', { name: 'Submit Claim' }).click();

  const response = await createClaimResponse;
  expect(response.status()).toBe(201);
  const createdClaim = (await response.json()) as {
    claimId: string;
    status: string;
  };
  expect(createdClaim.status).toBe('SUBMITTED');

  await expect(page).toHaveURL(/\/claims$/);
  await expect(page.getByRole('heading', { name: 'My Claims' })).toBeVisible();

  const claimIdPrefix = createdClaim.claimId.slice(0, 8);
  const createdClaimRow = page.getByRole('row').filter({ hasText: claimIdPrefix });
  await expect(createdClaimRow).toBeVisible();
  await expect(createdClaimRow).toContainText(claimMarker);
  await expect(createdClaimRow).toContainText('$2,500.00');
  await expect(
    createdClaimRow.getByLabel('Claim status: Submitted')
  ).toBeVisible();
});
