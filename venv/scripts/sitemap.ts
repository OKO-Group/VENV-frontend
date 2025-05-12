import { SitemapStream, streamToPromise } from 'sitemap'
import { createWriteStream } from 'fs'
import path from 'path'

const links = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/explore', changefreq: 'weekly' },
  { url: '/artists', changefreq: 'monthly' },
  { url: '/search', changefreq: 'daily' },
  { url: '/about', changefreq: 'monthly' },
  // Add dynamic paths here if needed
]

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: 'https://venv.co' })
  const writeStream = createWriteStream(path.resolve('public', 'sitemap.xml'))

  sitemap.pipe(writeStream)

  for (const link of links) {
    sitemap.write(link)
  }

  sitemap.end()

  await streamToPromise(sitemap)
  console.log('✅ sitemap.xml generated in /public')
}

generateSitemap()
