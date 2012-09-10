var git = require('gitty'),
    url = require('url'),
    path = require('path'),
    fs_helper = require('./fs_helper'),
    request_helper = require('./request_helper');

exports.clone_adafruit_libraries = function(adafruit_repository, remote, cb) {
  fs_helper.check_for_repository(adafruit_repository, function(err, status) {
    if (!err && !status) {
    git.clone(__dirname + "/../repositories", remote, function(output) {
      console.log(output);
      cb();
    });
    } else {
      cb();
    }
  });
};

exports.clone_update_remote_push = function(profile, repository_url, cb) {
  var self = this;
  console.log(profile);
  var repository_name = path.basename(repository_url, '.git');
  console.log(repository_name);
  console.log(repository_url);

  request_helper.list_repositories(profile, function(err, list) {
    var exists = list.some(function(repository) {
      return (repository.name === repository_name);
    });
    if (!exists) {
      //TODO need better error handling eventually
      request_helper.create_repository(profile, repository_name, function(err, response) {
        console.log("created repository in bitbucket: " + repository_name);
        self.clone_repository(profile, repository_url, function(err, results) {
          console.log("clone repository locally: " + repository_name);
          self.update_remote(profile, repository_name, function(err, response) {
            console.log("updated remote for repository: " + repository_name);
            self.push(repository_name, "origin", "master", function(err, response) {
              console.log("git push for repository: " + repository_name);
              cb(null, true);
            });
          });
        });
      });
    } else {
      cb("Repository Already Exists in Bitbucket.", false);
    }
  });
};

exports.clone_repository = function(profile, repository_path, cb) {
  var repository_url = url.parse(repository_path);

  console.log("cloning", repository_path);
  git.clone(__dirname + "/../repositories", repository_url.href, function(output) {
    cb(output.error, output.message);
  });
};

exports.update_remote = function(profile, repository, cb) {
  var remote_url = "ssh://git@bitbucket.org/" + profile.username + "/" + repository.toLowerCase() + ".git";
  git.remote.update(__dirname + "/../repositories/" + repository, "origin", remote_url, function(output) {
    //console.log(output);
    cb(output.error, output.message);
  });
};

exports.add_remote = function(repository, remote_name, remote_url, cb) {
  git.remote.add(__dirname + "/../repositories/" + repository, remote_name, remote_url, function(output) {
    //console.log(output);
    cb(output.error, output.message);
  });
};

exports.add = function add(repository, files, cb) {
  if (!Array.isArray(files)) {
    files = [files];
  }
  var repository_path = __dirname + "/../repositories/" + repository;
  git.add(repository_path, files, function(output) {
    //console.log(output);
    cb(output.errors, output.added);
  });
};

exports.remove = function remove(repository, files, cb) {
  if (!Array.isArray(files)) {
    files = [files];
  }
  var repository_path = __dirname + "/../repositories/" + repository;
  git.remove(repository_path, files, function(output) {
    console.log(output);
    cb(output.errors, output.added);
  });
};

exports.remove_recursive = function remove_recursive(repository, path, cb) {
  var repository_path = __dirname + "/../repositories/" + repository;

  git.remove_recursive(repository_path, path, function(output) {
    console.log(output);
    cb(output.errors, output.added);
  });
};

exports.commit = function commit(repository, message, cb) {
  var repository_path = __dirname + "/../repositories/" + repository;
  git.commit(repository_path, message, function(obj) {
    //console.log(obj);
    cb(obj.error, obj.message);
  });
};

exports.push = function push(repository, remote, branch, cb) {
  var repository_path = __dirname + "/../repositories/" + repository;
  git.push(repository_path, remote, branch, function(obj) {
    //console.log(obj);
    cb(obj.error, obj.message);
  });
};

exports.pull = function push(repository, remote, branch, cb) {
  var repository_path = __dirname + "/../repositories/" + repository;
  git.pull(repository_path, remote, branch, function(obj) {
    //console.log(obj);
    cb(obj.error, obj.message);
  });
};


exports.remove_commit_push = function(item, cb) {
  var self = this;
  console.log(item);
  var path_array = item.path.split('/');
  var repository = path_array[2];
  var item_path = path_array.slice(3).join('/');
  console.log(item_path);
  console.log(repository);


  if (item.type === 'directory') {
    self.remove_recursive(repository, item_path, function(err, status) {

      console.log(obj);
    });
  } else {
    self.remove(repository, item_path, function(err, status) {
      var commit_message = "Removed " + item.name;
      self.commit(repository, commit_message,  function(err, status) {
        self.push(repository, "origin", "master", function(err, status) {
      //console.log(obj);
        });
      });
    });
  }
};

exports.commit_push_and_save = function(file, cb) {
  var self = this;
  var path_array = file.path.split('/');
  var repository = path_array[2];
  var file_path = path_array.slice(3).join('/');

  self.add(repository, file_path, function(err, status) {
    console.log("added", err, status);
    var commit_message = "Modified " + file.name;
    self.commit(repository, commit_message,  function(err, status) {
      console.log("committed", err, status);
      self.push(repository, "origin", "master", function(err, status) {
        console.log("pushed", err, status);
        cb(status);
      });
    });
  });
};