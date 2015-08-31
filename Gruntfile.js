var handlebars = require('handlebars');
var _ = require('lodash');
var semver = require('semver');
var fs = require('fs');
var moment = require('moment');

moment.locale('zh-cn');

/*global module:false*/
module.exports = function(grunt) {

  var DOWNLOAD_PREFIX = 'http://down.golaravel.com/';
  var laravel_tags;
  var lumen_tags;

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    exec: {
      composer_selfupdate: {
        cmd: 'composer selfupdate',
        stdout: false,
        stderr: false
      },
      clone_laravel: {
        cmd: 'git clone https://github.com/laravel/laravel --depth=1 --no-single-branch -q',
        stdout: false,
        stderr: false
      },
      list_laravel_tags: {
        cmd: 'git tag --list',
        cwd: './laravel',
        callback: function(err, stdout, stderr) {
          if(stderr.length > 0) {
            grunt.fail.fatal('git tag failed!');
          }

          var tags = stdout.toString().trim().split('\n').filter(function(tag){
            if(/^v3/.test(tag)) {
              return false;
            } 

            return true;
          });

          tags = _.chain(tags).groupBy(function(ver){
            return [semver.major(ver), semver.minor(ver)].join('.');
          }).map(function(group){
            return _.reduce(group, function(result, ver){
              if(semver.gt(result, ver)) return result;

              return ver;
            });
          }).value();

          tags.push('master');

          console.log(tags);

          laravel_tags = tags;
        },
        stdout: false,
        stderr: false
      },
      export_laravel_versions: {
        cmd: function() {
          var template = '{{#tags}}git archive --format=tar --prefix=laravel-{{this}}/ {{this}} | tar xf - && {{/tags}}';
          var cmd;
          var tags = laravel_tags;

          template = handlebars.compile(template);
          cmd = template({tags: tags}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'laravel',
        stdout: false,
        stderr: false
      },
      laravel_composer_install: {
        cmd: function(){
          var cwd = process.cwd();
          var template = '{{#tags}}(cd {{../cwd}}/laravel/laravel-{{this}} && cp .env.example .env >/dev/null 2>&1 || true &&' +
            'composer install && php artisan key:generate >/dev/null 2>&1 || true) && {{/tags}}';
          var cmd;
          var tags = laravel_tags;

          template = handlebars.compile(template);
          cmd = template({tags: tags, cwd: cwd}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'laravel',
        stdout: false,
        stderr: false
      },


      clone_lumen: {
        cmd: 'git clone https://github.com/laravel/lumen --depth=1 --no-single-branch -q',
        stdout: false,
        stderr: false
      },
      list_lumen_tags: {
        cmd: 'git tag --list',
        cwd: './lumen',
        callback: function(err, stdout, stderr) {
          if(stderr.length > 0) {
            grunt.fail.fatal('git tag failed!');
          }

          var tags = stdout.toString().trim().split('\n').filter(function(tag){
            return true;
          });

          tags = _.chain(tags).groupBy(function(ver){
            return [semver.major(ver), semver.minor(ver)].join('.');
          }).map(function(group){
            return _.reduce(group, function(result, ver){
              if(semver.gt(result, ver)) return result;

              return ver;
            }); 
          }).value();

          tags.push('master');

          console.log(tags);

          lumen_tags = tags;
        },
        stdout: false,
        stderr: false
      },
      export_lumen_versions: {
        cmd: function() {
          var template = '{{#tags}}git archive --format=tar --prefix=lumen-{{this}}/ {{this}} | tar xf - && {{/tags}}';
          var cmd;
          var tags = lumen_tags;

          template = handlebars.compile(template);
          cmd = template({tags: tags}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'lumen',
        stdout: false,
        stderr: false
      },
      lumen_composer_install: {
        cmd: function(){
          var cwd = process.cwd();
          var template = '{{#tags}}(cd {{../cwd}}/lumen/lumen-{{this}} && cp .env.example .env >/dev/null 2>&1 || true && ' +
            'composer install) && {{/tags}}';
          var cmd;
          var tags = lumen_tags;

          template = handlebars.compile(template);
          cmd = template({tags: tags, cwd: cwd}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;post-create-project-cmd
        },
        cwd: 'lumen',
        stdout: false,
        stderr: false
      },

      zip_lumen: {
      	cmd: function(){
          var cwd = process.cwd();
          var template = '{{#tags}}(echo {{this}} && zip -q -r lumen-{{this}}.zip lumen-{{this}}) && {{/tags}}';
          var cmd;
          var tags = lumen_tags;

          template = handlebars.compile(template);
          cmd = template({tags: tags, cwd: cwd}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'lumen',
        stdout: false,
        stderr: false
      },
      zip_laravel: {
      	cmd: function(){
          var cwd = process.cwd();
          var template = '{{#tags}}(echo {{this}} && zip -q -r laravel-{{this}}.zip laravel-{{this}}) && {{/tags}}';
          var cmd;
          var tags = laravel_tags;

          template = handlebars.compile(template);
          cmd = template({tags: tags, cwd: cwd}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'laravel',
        stdout: false,
        stderr: false
      }
    },
    clean: ['laravel', 'lumen'],
    zip_directories: {
      versions: {
        files: [{
          filter: 'isDirectory',
          expand: true,
          cwd: './laravel',
          src: ['laravel-*'],
          dest: './laravel'
        },
        {
          filter: 'isDirectory',
          expand: true,
          cwd: './lumen',
          src: ['lumen-*'],
          dest: './lumen'
        }
        ]
      }
    },
    ftp_push: {
      upyun: {
        options: {
          host: 'v0.ftp.upyun.com',
          authKey: 'upyun',
          dest: '/'
        },
        files: [{
          expand: true,
          cwd: 'laravel',
          src: ['*.zip', 'laravel-*.json']
        },
        {
          expand: true,
          cwd: 'lumen',
          src: ['*.zip']
        }
        ]
      }
        
    },
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /<html lang="en(-US)?">/ig,
              replacement: '<html lang="zh-CN">'
            },
            //v4
            {
              match: /@import url\(\/\/fonts.googleapis.com\/css\?family=.*\);/ig,
              replacement: ''
            },

            //v5
            {
              match: /<link.*fonts.googleapis.com.*>/ig,
              replacement: ''
            },
            {
              match: /<script src="https:\/\/oss.maxcdn.com\/html5shiv\/(\d\.\d\.\d)\/html5shiv.min.js"><\/script>/ig,
              replacement: '<script src="http://cdn.bootcss.com/html5shiv/$1/html5shiv.min.js"></script>'
            },
            {
              match: /<script src="https:\/\/oss.maxcdn.com\/respond\/(\d\.\d\.\d)\/respond.min.js"><\/script>/ig,
              replacement: '<script src="http://cdn.bootcss.com/respond.js/$1/respond.min.js"></script>'
            },
            {
              match: /\/\/cdnjs.cloudflare.com\/ajax\/libs/ig,
              replacement: 'http://cdn.bootcss.com'
            },
            {
              match: /twitter-bootstrap/ig,
              replacement: 'bootstrap'
            }
          ]
        },
        files: [
          {expand: true, cwd: 'laravel', src: ['laravel-*/resources/views/**/*.blade.php'], dest: 'laravel'},
          {expand: true, cwd: 'laravel', src: ['laravel-*/app/views/**/*.php'], dest: 'laravel'}
        ]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-zip-directories');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-ftp-push-fullpath');
  grunt.loadNpmTasks('grunt-replace');

  // Default task.
  grunt.registerTask('default', [
    'clean', 
    'exec:composer_selfupdate',
    'exec:clone_laravel', 
    'exec:list_laravel_tags', 
    'exec:export_laravel_versions', 

    'exec:clone_lumen', 
    'exec:list_lumen_tags', 
    'exec:export_lumen_versions', 

    'replace',
    'exec:laravel_composer_install',
    'exec:lumen_composer_install',

    'exec:zip_laravel',
    'exec:zip_lumen',
    'version_list',
    'ftp_push'
  ]);

  grunt.registerTask('test', ['exec:git_tag_list', 'version-list']);

  grunt.registerTask('version_list', 'save all laravel  & lumen zips\' url to a json file', function(){
    var laravels;
    var lumens;
    var now = moment().format('LLL');

    laravels = _.map(laravel_tags, function(tag){
      var states = fs.statSync('laravel/laravel-' + tag + '.zip');

      return {
        version: tag,
        download_url: DOWNLOAD_PREFIX + 'laravel/laravel-' +  tag + '.zip',
        size: states.size
      };
    }).reverse();

    lumens = _.map(lumen_tags, function(tag){
      var states = fs.statSync('lumen/lumen-' + tag + '.zip');

      return {
        version: tag,
        download_url: DOWNLOAD_PREFIX + 'lumen/lumen-' +  tag + '.zip',
        size: states.size
      };
    }).reverse();

    grunt.file.write('laravel/laravel-versions.json', 'listLaravelVersions(' + JSON.stringify({time: now, laravels: laravels, lumens: lumens}) + ');');
  });

};
