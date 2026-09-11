const { chromium } = require('playwright');
const path = require('path');

const SHOT_DIR = path.join(__dirname, 'shots');
require('fs').mkdirSync(SHOT_DIR, { recursive: true });

const consoleErrors = [];
const pageErrors = [];

function logConsole(page, label) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${label}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    pageErrors.push(`[${label}] ${err.message}`);
  });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: true });
  console.log(`[screenshot] ${name}`);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();
  logConsole(page, 'main');

  try {
    console.log('=== 1. Home ===');
    await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' });
    await shot(page, '01_home');

    const startBtn = page.locator('button', { hasText: /try demo candidate \(ananya sharma\)/i }).first();
    await startBtn.waitFor({ state: 'visible', timeout: 10000 });
    console.log('=== 2. Click Try Demo Candidate (hero button) ===');
    await startBtn.click();
    await page.waitForTimeout(2000); // let the async demo API call resolve + client-side navigate
    console.log('URL after click:', page.url());
    await shot(page, '02_candidate');

    console.log('candidate screen text sample:', (await page.locator('h2').first().textContent().catch(() => 'N/A')));

    console.log('=== 3. Go to Resume Upload screen ===');
    await page.goto('http://localhost:5180/candidate/resume', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await shot(page, '03_resume_upload');

    console.log('=== 4. Go to Initial Profile ===');
    await page.goto('http://localhost:5180/candidate/profile', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await shot(page, '04_initial_profile');

    console.log('=== 5. Go to Role Selection ===');
    await page.goto('http://localhost:5180/roles', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot(page, '05_role_selection');

    console.log('=== 6. Navigate to Role Requirements for role-sso-01 (triggers selectTargetRole via useEffect) ===');
    await page.goto('http://localhost:5180/roles/role-sso-01', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, '07_role_requirements');

    console.log('=== 8. Start Assessment ===');
    await page.goto('http://localhost:5180/assessment', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot(page, '08_assessment_q1');

    // Answer questions live until the assessment completes (or a safety cap), then follow through
    // to results/gaps/courses/learning-path — options live in the "Select Methodologically Sound
    // Action" block, class combo "space-y-3 pt-2" per Assessment.tsx.
    let completed = false;
    for (let i = 0; i < 12; i++) {
      const errorBanner = await page.getByText('Something went wrong').isVisible().catch(() => false);
      if (errorBanner) {
        console.log(`!!! error banner visible at question ${i + 1}`);
        await shot(page, `08_ERROR_at_q${i + 1}`);
        break;
      }
      const optionButtons = await page.locator('div.space-y-3.pt-2 > button').all();
      console.log(`question ${i + 1}: found ${optionButtons.length} option buttons`);
      if (optionButtons.length === 0) {
        // Either still loading, or the assessment auto-completed and navigated away.
        await page.waitForTimeout(1000);
        if (page.url().includes('/assessment/results')) {
          completed = true;
          console.log('assessment auto-completed and navigated to results');
        }
        break;
      }
      const alreadyAnswered = await optionButtons[0].isDisabled().catch(() => false);
      if (alreadyAnswered) {
        console.log(`question ${i + 1}: options already disabled (stale render) — waiting for navigation instead of clicking`);
        await page.waitForTimeout(1500);
        if (page.url().includes('/assessment/results')) {
          completed = true;
          console.log('assessment completed while waiting, navigated to results');
        }
        break;
      }
      await optionButtons[1 % optionButtons.length].click({ timeout: 5000 });
      await page.waitForTimeout(600);
      const nextBtn = page.getByRole('button', { name: /next question|complete assessment/i }).first();
      if (await nextBtn.isVisible().catch(() => false)) {
        const isDisabled = await nextBtn.isDisabled().catch(() => true);
        if (!isDisabled) {
          await nextBtn.click();
          await page.waitForTimeout(1500);
        }
      }
      if (page.url().includes('/assessment/results')) {
        completed = true;
        console.log(`assessment completed after ${i + 1} answers, navigated to results`);
        break;
      }
    }
    await shot(page, '09_assessment_end');

    if (!completed) {
      console.log('=== Forcing completion via "Complete & View Verified Results" ===');
      const completeBtn = page.getByRole('button', { name: /complete & view verified results/i }).first();
      if (await completeBtn.isVisible().catch(() => false)) {
        await completeBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    console.log('=== 10. Assessment Results ===');
    await page.waitForTimeout(1000);
    console.log('URL:', page.url());
    await shot(page, '10_assessment_results');

    console.log('=== 11. Capability Profile ===');
    await page.goto('http://localhost:5180/capability', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot(page, '11_capability_profile');

    console.log('=== 12. Skill Gaps ===');
    await page.goto('http://localhost:5180/gaps', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot(page, '12_skill_gaps');

    console.log('=== 13. Courses ===');
    await page.goto('http://localhost:5180/courses', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot(page, '13_courses');

    console.log('=== 14. Learning Path ===');
    await page.goto('http://localhost:5180/learning-path', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, '14_learning_path');

    console.log('=== 15. Dashboard ===');
    await page.goto('http://localhost:5180/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot(page, '15_dashboard');

    console.log('=== 16. Refresh mid-flow (on Learning Path) to test resume-on-refresh ===');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('URL after refresh:', page.url());
    await shot(page, '16_after_refresh');

    console.log('=== Console errors so far ===');
    consoleErrors.forEach(e => console.log(e));
    console.log('=== Page errors so far ===');
    pageErrors.forEach(e => console.log(e));

  } catch (err) {
    console.error('DRIVER ERROR:', err.message);
    await shot(page, 'ERROR_state').catch(() => {});
  } finally {
    console.log('\n=== FINAL: console errors ===');
    consoleErrors.forEach(e => console.log(e));
    console.log('=== FINAL: page errors ===');
    pageErrors.forEach(e => console.log(e));
    await browser.close();
  }
})();
