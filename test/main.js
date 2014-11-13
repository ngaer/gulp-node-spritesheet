/* global describe, it */

var sprites = require('../'),
	fs = require('fs'),
	assert = require('assert'),
	gutil = require('gulp-util'),
	pj = require('path').join;

function createVinyl(lessFileName, contents) {
	var base = pj(__dirname, 'src'),
		filePath = pj(base, lessFileName);

	return new gutil.File({
		cwd: __dirname,
		base: base,
		path: filePath,
		contents: contents || fs.readFileSync(filePath)
	});
}

describe('gulp-node-spritesheet', function () {
	describe('sprites()', function() {
		var outputCss = './sprite.css',
			params = {
				outputCss: outputCss,
				selector: '.icon',
				outputImage: 'sprite.png'
			};

		afterEach(function() {
			var filePath = process.cwd() + '/' + outputCss;

			fs.readFile(filePath, function(error, data) {
				if (data) {
					fs.unlink(filePath, function() {});
				}
			});
		});

		it('should pass file when it isNull()', function (done) {
			var stream = sprites(params),
				emptyFile = {
					isNull: function () { return true; }
				};

			stream
				.on('data', function (data) {
					assert.equal(data, emptyFile);
					done();
				})
				.push(emptyFile);
		});

		it('should emit error when file isStream()', function (done) {
			var stream = sprites(params),
				streamFile = {
					isNull: function () { return false; },
					isStream: function () { return true; }
				};

			stream.on('error', function (err) {
				assert.equal(err.message, 'Streams are not supported!');
				done();
			});
			stream.write(streamFile);
		});

		it('should generate simple sprite', function (done) {
			var stream = sprites(params);

			stream.on('data', function (spriteFile) {
				var filePath = process.cwd() + '/' + outputCss;

				assert.equal(spriteFile.relative, params.outputImage, 'output sprite name does not equal to the name from params');

				fs.readFile(filePath, 'utf-8', function(error, data) {
					assert.equal(error, null, 'css file can not be found');

					if (data) {
						assert.notEqual(data.match(/\.icon/), null, 'css does not contain specified selector');
					}
				});
				done();
			});

			[createVinyl('circle.png'), createVinyl('square.png')].forEach(function(file) {
				stream.write(file);
			});
			stream.end();
		});

		it('should generate 2 sprites with different ratio', function (done) {
			var spritesCount = 0,
				stream = sprites({
					outputCss: outputCss,
					selector: '.icon',
					output: {
						legacy: {
							pixelRatio: 1,
							outputImage: 'sprite.png'
						},
						retina: {
							pixelRatio: 2,
							outputImage: 'sprite@2x.png'
						}
					}
				});

			stream.on('data', function (spriteFile) {
				var filePath = process.cwd() + '/' + outputCss;

				assert.equal(spriteFile.relative, ['sprite.png', 'sprite@2x.png'][spritesCount], 'output sprite name does not equal to the name from params');
				spritesCount++;

				if (spritesCount === 2) {
					fs.readFile(filePath, 'utf-8', function(error, data) {
						assert.equal(error, null, 'css file can not be found');

						if (data) {
							assert.notEqual(data.match(/\.icon/), null, 'css does not contain specified selector');
						}
					});

					done();
				}
			});

			[createVinyl('circle.png'), createVinyl('square.png')].forEach(function(file) {
				stream.write(file);
			});
			stream.end();
		});

	});
});