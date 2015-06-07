var handlebars = require('handlebars');
var _ = require('lodash');
var semver = require('semver');

/*global module:false*/
module.exports = function(grunt) {

  var tags;

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
      composer_sefupdate: {
        cmd: 'composer selfupdate',
        stdout: false,
        stderr: false
      },
      git_clone: {
        cmd: 'git clone https://github.com/laravel/laravel --depth=1 --no-single-branch -q',
        stdout: false,
        stderr: false
      },
      git_tag_list: {
        cmd: 'git tag --list',
        cwd: './laravel',
        callback: function(err, stdout, stderr) {
          if(stderr.length > 0) {
            grunt.fail.fatal('git tag failed!');
          }

          tags = stdout.toString().trim().split('\n').filter(function(tag){
            if(/^v3/.test(tag)) {
              return false;
            } 

            return true;
          });

          tags = _.chain(tags).groupBy(function(ver){
            return [semver.major(ver), semver.minor(ver)].join('.');
          }).map(function(group){
            console.log(_.last(group));
            return _.last(group);
          }).value();

          tags.push('master');

          console.log(tags);
        },
        stdout: false,
        stderr: false
      },
      git_export_versions: {
        cmd: function() {
          var template = '{{#tags}}git archive --format=tar --prefix=laravel-{{this}}/ {{this}} | tar xf - && {{/tags}}';
          var cmd;

          template = handlebars.compile(template);
          cmd = template({tags: tags}).replace(/&&\s*$/g, '');

          console.log(cmd);
          return cmd;
        },
        cwd: 'laravel',
        stdout: false,
        stderr: false
      },
      composer: {
        cmd: function(){
          var cwd = process.cwd();
          // var template = '{{#tags}}(cd {{../cwd}}/{{this}} && composer install) && {{/tags}}';
          var template = '{{#tags}}(echo {{this}} && composer install -d laravel-{{this}}) && {{/tags}}';
          var cmd;

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
    clean: ['laravel'],
    zip_directories: {
      versions: {
        files: [{
          filter: 'isDirectory',
          expand: true,
          cwd: './laravel',
          src: ['laravel-*'],
          dest: './laravel'
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
          src: ['*.zip']
        }
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

  // Default task.
  grunt.registerTask('default', [
    'clean', 
    'exec:git_clone', 
    'exec:git_tag_list', 
    'exec:git_export_versions', 
    'exec:composer',
    'zip_directories', 
    'ftp_push']);

};
