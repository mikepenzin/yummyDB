var gulp        = require('gulp'),
    xml2json = require('gulp-xml2json'),
    rename = require('gulp-rename');
    

// define the default task and add the watch task to it
// gulp.task('default', ['createJson']);


gulp.task('default', function () {
    gulp.src('sitemap.xml')
        .pipe(xml2json())
        .pipe(rename({extname: '.json'}))
        .pipe(gulp.dest('dist'));
});