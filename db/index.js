const { open, unlink, ftruncate, readdir, readFile, stat, mkdirSync } = require('fs')
const { join } = require('path')
const { promisify } = require('util')

const { write, stringToJson } = require('./utils')
const baseDir = join(__dirname, '../.data')

const _create = (dir, file, data, done) => {
  const dataDir = join(baseDir, dir)
  const fileName = join(dataDir, `${file}.json`)
  open(fileName, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data)
      write(fileDescriptor, dataString, done)
    } else {
      done('Cannot create new file, it may exist already.')
    }
  })
}

const _read = (dir, file, done) => {
  readFile(join(baseDir, dir, `${file}.json`), 'utf8', (err, data) => {
    if (!err && data) {
      stringToJson(data, (err, parsed) => {
        if (!err && parsed) {
          done(false, parsed)
        } else {
          done(err)
        }
      })
    } else {
      done(err)
    }
  })
}

const _update = (dir, file, data, done) => {
  open(join(baseDir, dir, `${file}.json`), 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data)
      ftruncate(fileDescriptor, () => {
        if (!err) {
          write(fileDescriptor, dataString, done)
        } else {
          done('Error truncating file.')
        }
      })
    } else {
      done('Cannot open file for updating, file may not exist.')
    }
  })
}

const _exists = (dir, file, done) => {
  const filepath = join(baseDir, dir, `${file}.json`)
  stat(filepath, (err, _) => {
    if (!err) {
      done(false, true)
    } else {
      done(false, false)
    }
  })
}

const _del = (dir, file, done) => {
  const filepath = join(baseDir, dir, `${file}.json`)
  stat(filepath, (err, _) => {
    if (!err) {
      unlink(filepath, (err) => {
        if (!err) {
          done(false, {})
        } else {
          done('Error deleting file.')
        }
      })
    } else {
      done('File doens\'t exist.')
    }
  })
}

const exists = promisify(_exists)

const _list = (dir, done) => {
  const d = join(baseDir, dir)
  stat(d, (err, _) => {
    if (!err) {
      readdir(d, (err, data) => {
        if (!err && data && data.length > 0) {
          const trimmedFilename = []
          data.forEach((filename) => {
            if (filename.indexOf('.json') > -1) {
              trimmedFilename.push(filename.replace('.json', ''))
            }
          })
          done(false, trimmedFilename)
        } else {
          done(err)
        }
      })
    } else {
      done(err.message)
    }
  })
}

module.exports.md = (dir) => {
  const dataDir = join(baseDir, dir)
  mkdirSync(dataDir, { recursive: true })
}

module.exports.create = promisify(_create)
module.exports.read = promisify(_read)
module.exports.update = promisify(_update)
module.exports.del = promisify(_del)
module.exports.list = promisify(_list)
module.exports.exists = exists
