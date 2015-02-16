/*
 * gulp-node-spritesheet
 * https://github.com/ngaer/gulp-node-spritesheet
 *
 * Copyright (c) 2014 Gaer Nikita
 * Licensed under the MIT license.
 */

'use strict';

var gutil = require('gulp-util'),
	through = require('through'),
	sprites = require('node-spritesheet'),
	path = require('path'),
	fs = require('fs'),
	Q = require('q');

module.exports = function(options) {
	var builder,
		builderOptions = {
			images: []
		},
		outputOptions = options.output,
		cwd = process.cwd(),
		timestamp = new Date().getTime();

	// Create a config of allowed options
	[
		'selector',
		'outputCss',
		'outputImage',
		'outputDirectory',
		'downsampling',
		'resolveImageSelector',
		'httpImagePath',
		'filter'
	].forEach(function(option) {
		if (option === 'outputImage' && outputOptions) {
			return;
		}

		if (options[option]) {
			builderOptions[option] = options[option];
		}
	});

	// Add timestamp to name of output file for prevent of overwriting existing files with the same name
	function replaceOutput(output) {
		output.outputImage = output.outputImage.replace(/([^.])\.([^.])/g, '$1_' + timestamp + '.$2');
	}

	if (builderOptions.outputImage) {
		replaceOutput(builderOptions);
	}

	function bufferFiles(file) {
		if (file.isNull()) {
			return;
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-node-spritesheet', 'Streams are not supported!'));
			return;
		}

		// Getting of outputDirectory from path of the first file in the stream
		if (!builderOptions.outputDirectory) {
			builderOptions.outputDirectory = path.basename(file.path, path.extname(file.path));

			// Specify css path relative to the gulp config directory
			if (builderOptions.outputCss) {
				builderOptions.outputCss = path.relative(builderOptions.outputDirectory, cwd) + '/' + builderOptions.outputCss;
			}
		}

		// Collect image paths
		builderOptions.images.push(file.path);
	}

	function endStream() {
		var self = this,
			outputFiles = [];

		// Skip compile in case of empty image list
		if (!builderOptions.images.length) {
			self.emit('end');
			return;
		}

		builder = new sprites.Builder(builderOptions);

		// Add output configurations
		if (outputOptions) {
			Object.keys(outputOptions).forEach(function(key) {
				var outputOptionsItem = outputOptions[key];

				replaceOutput(outputOptionsItem);
				builder.addConfiguration(key, outputOptionsItem);
				outputFiles.push(outputOptionsItem.outputImage);
			});
		} else {
			outputFiles.push(builderOptions.outputImage);
		}

		builder.build(function() {
			var queue = [];
			/*
				Plugin node-spritesheet doesn't support streaming of compiled files, it can just save it in fs by
				configuration. So to make it more 'gulp way', we read this compiled files and push it to a stream, and
				remove files form fs after.
			*/
			outputFiles.forEach(function(file) {
				var filePath = builderOptions.outputDirectory + '/' + file,
					deferred = Q.defer();

				fs.readFile(filePath, function(error, data) {
					if (error) {
						self.emit('error', new gutil.PluginError('gulp-node-spritesheet', error));
					}

					if (data) {
						fs.unlink(filePath, function (error) {
							if (error) {
								throw error;
							}
						});

						self.emit('data', new gutil.File({
							cwd: cwd,
							base: cwd,
							path: cwd + '/' + file.replace('_' + timestamp, ''),
							contents: data
						}));
					}
					deferred.resolve();
				});

				queue.push(deferred.promise);
			});

			Q.all(queue).then(function() {
				self.emit('end');
			});
		});
	}

	return through(bufferFiles, endStream);
};
