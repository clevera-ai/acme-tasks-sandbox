// GitHub Pages has no SPA fallback: 404.html is a copy of index.html so deep links work,
// and the main routes (and the seeded projects' pages) also get a real index.html so they answer 200.
import { copyFileSync, mkdirSync } from 'node:fs'
const html = 'dist/index.html'
copyFileSync(html, 'dist/404.html')
for (const dir of ['projects', 'billing', 'integrations', 'settings', 'settings/profile', 'settings/notifications', 'settings/members', 'projects/p-web', 'projects/p-mobile', 'projects/p-onboard']) {
  mkdirSync(`dist/${dir}`, { recursive: true })
  copyFileSync(html, `dist/${dir}/index.html`)
}
