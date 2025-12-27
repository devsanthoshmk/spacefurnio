// dev file for parsing product JSON files

import { readdir, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Folder where your JSON files are stored
const folderPath = './products'

// Read all files in the folder
readdir(folderPath, (err, files) => {
  if (err) {
    console.error('Failed to list files:', err)
    return
  }

  // Filter only .json files
  const jsonFiles = files.filter((file) => file.endsWith('.json'))

  jsonFiles.forEach((file) => {
    const filePath = join(folderPath, file)
    const rawData = readFileSync(filePath, 'utf8')
    let items

    try {
      items = JSON.parse(rawData)
    } catch (e) {
      console.error(`Failed to parse JSON in ${file}:`, e)
      return
    }

    // Update each item's href
    items.forEach((item) => {
      if (item.id) {
        delete item.href
      }
    })

    // Write updated data back to the same file
    writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8')
    console.log(`Updated: ${file}`)
  })
})
