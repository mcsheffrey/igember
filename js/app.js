/* ============================================================
 * Ember.js Instagram Demo
 * http://github.com/mcsheffrey/igember
 * @mcsheffrey
 * ============================================================ */


// Create our Application
(function () {

  // OAuth setup
  Ember.OAuth2.config = {
    instagram: {
      clientId: "78e0cc2b8e2440c385969867dc38b7c6",
      authBaseUri: 'https://instagram.com/oauth/authorize/',
      redirectUri: 'http://localhost:8000/callback.html',
      scope: 'basic comments relationships likes'
    }
  };

  Ember.LOG_BINDINGS = true;

  // Array of different instagram feeds to filter by
  var photoFeeds = [
    'self',
    'popular',
    'recent'
  ],
  API_GLOBALS = {
    AUTH_TOKEN: (JSON.parse(localStorage.getItem('token-instagram'))) ? JSON.parse(localStorage.getItem('token-instagram')).access_token : false,
    API_ENDPOINTS: 'https://api.instagram.com/v1/',
    ERROR_MESSAGES: "Fail."
  };

  window.EmberInstagram = Ember.Application.create({
    LOG_TRANSITIONS: true
  });

  Ember.OAuth2.reopen({ onSuccess: function() { return 'hello, onSuccess' } });
  Ember.OAuth2.reopen({ onError: function() { return 'hello, onError' } });


 

  EmberInstagram.Media = Ember.Object.extend({
    loaded: false,
    showComments: true,
    clientID: '5ee7e77d7b0b441f9cd307a5f30c92bb',
    authToken: (JSON.parse(localStorage.getItem('token-instagram'))) ? JSON.parse(localStorage.getItem('token-instagram')).access_token : false,
    baseUrl: 'https://api.instagram.com/v1/',
    popularUrl: 'media/popular?client_id=',
    userUrl: 'users/self/feed?access_token=',
    recentUrl: '/users/' + this.userId  + '/media/recent?access_token=',
    url: function() {
      console.log(this.get('id'));
      if (!this.authToken || this.get('id') == 'popular') {

        // 'https://api.instagram.com/v1/media/popular?client_id=5ee7e77d7b0b441f9cd307a5f30c92bb&callback=?'
        return this.baseUrl + this.popularUrl + this.clientID + '&callback=?';
      }
      if (this.get('id') == 'self' && this.authToken) {
        return this.baseUrl + this.userUrl + this.authToken + '&callback=?';
      }
      if (this.get('id') == 'recent' && this.authToken) {
         return this.baseUrl + '/users/' + this.authToken.substr(0, this.authToken.indexOf('.'))  + '/media/recent?access_token=' + this.authToken + '&callback=?';
      }
    }.property('url'),

    loadLinks: function() {
      if (this.get('loaded')) return;
      
      
      // if (this.get('controllers.media.id') == 'popular') {
      //   console.log('pouplargram');
        
      // };

      var media = this;
      $.getJSON(this.get('url')).then(function(response) {
        var links = Em.A(),
            linkIndex = 0;
        console.log(response);

        // Mapping next and previous thumbnails/urls to Ember object (this is probably the wrong way to do this :/ )
        response.data.forEach(function (child) {
          console.log(child);
          child.mediaIndex = linkIndex;
          if (linkIndex > 0) {
            child.previousMediaThumb = response.data[0].images.thumbnail.url;
          }
          if (linkIndex < response.data.length-1) {
            child.nextMediaThumb = response.data[linkIndex+1].images.thumbnail.url;
          }
          
          links.push(EmberInstagram.Link.create(child));

          linkIndex++;
        });

        media.setProperties({links: links, loaded: true});
      });
    },
    findNext: function(id) {
      console.log('something');
      
    },
    findPrev: function(id) {

    }
  });

  EmberInstagram.Media.reopenClass({
    store: {},

    find: function(id) {
      if (!this.store[id]) {
        this.store[id] = EmberInstagram.Media.create({id: id});
        console.log(this.store[id]);
      }
      return this.store[id];
    }
  });

  // Single Image model
  EmberInstagram.Link = Ember.Object.extend({

    photosOfYou: function() {
      var userInPhoto = {},
          photoUsers = [];

      if (this.get('users_in_photo')[0]) {
        console.log(this.get('users_in_photo').length);
        
        for (var i = 0; i < this.get('users_in_photo').length; i++) {
          console.log(this.get('users_in_photo')[i]);
          userInPhoto['position'];
          console.log(userInPhoto);
          
          // userInPhoto['position']['x'] = this.get('users_in_photo')[0].position.x * 100;
          // userInPhoto.position['y'] = this.get('users_in_photo')[0].position.y * 100;
          // userInPhoto['user'];
          // userInPhoto.user.username = this.get('users_in_photo')[0].user.username;
          photoUsers.push({
            position: {
              x: this.get('users_in_photo')[i].position.x * 100,
              y: this.get('users_in_photo')[i].position.y * 100
            },
            user: {
              username: this.get('users_in_photo')[i].user.username
            }
          });
        };
        console.log('photoUsers',photoUsers);
        
        return photoUsers;
      };

      // return false;
      
    }.property('photosOfYou'),

    // userPositionX: function() {
    //   if (this.get('users_in_photo')[0]) {
    //     var positionX = this.get('users_in_photo')[0].position.x * 100;
    //     return positionX;
    //   };
      
    //   return false;
      
    // }.property('userPositionX'),

    // userPositionY: function() {
    //   if (this.get('users_in_photo')[0]) {
    //     var positionY = this.get('users_in_photo')[0].position.y * 100;
    //     return positionY;
    //   };
      
    //   return false;
      
    // }.property('userPositionY'),

    // Computed properties, just the Google Maps API Url for now, I'm guess there will be more here eventually
    mapUrl: function() {
      var latitude = this.get('location.latitude');
      // console.log(latitude);
      var longitude = this.get('location.longitude');
      
      if (!latitude) return false;

      var url = 'background-image: url(https://maps.googleapis.com/maps/api/staticmap?center='+latitude+','+longitude+'&zoom=12&size=326x100&sensor=false)';
      return url;

    }.property('location.latitude', 'location.longitude'),

    // We want to grab the single image endpoint here (requires oAuth)
    loadDetails: function() {

      // If we have a name, we're already loaded
      // console.log(this.get('id'));
      
      // if (this.get('id')) return;

      
      // var media = this;
      // var url = 'https://api.instagram.com/v1/media/popular?client_id=5ee7e77d7b0b441f9cd307a5f30c92bb&callback=?';
      // $.getJSON(url).then(function (response) {
      //   // console.log(response.data[0]);
        
      //   media.setProperties(response.data[0]);
      // });
    }

  });

  EmberInstagram.Link.reopenClass({
    store: {},

    find: function(id) {
      if (!this.store[id]) {
        this.store[id] = EmberInstagram.Link.create({id: id});

        
      }
      return this.store[id];
    }
  });

  // Controllers

  EmberInstagram.ApplicationController = Ember.Controller.extend({
    title: function() {
      console.log(this.get('controllers.media.id'));
      return this.get('controllers.media.id');
      
    }.property('id'),
    needs: ['media'],
    disableComments: function() {
      this.get('controllers.media').setProperties({showComments: false});
      setTimeout(function() {
        $('.photo-feed .span4').trigger('refreshWookmark');
      }, 500);
    },
    enableComments: function() {
      this.get('controllers.media').setProperties({showComments: true});
      setTimeout(function() {
        $('.photo-feed').trigger('refreshWookmark');
      }, 500);
    },
    sortRecent: function() {
      alert('TODO: Sort by recent.')
    },
    sortPopular: function() {
      alert('TODO: Sort by popular.')
    },
    authorizeInstagram: function() {
      EmberInstagram.oauth = Ember.OAuth2.create({providerId: 'instagram'});
      EmberInstagram.oauth.authorize();
    }
  });

  EmberInstagram.MediaController = Ember.ObjectController.extend({
    content: null,
    findNext: function(id) {
      console.log('next', id);
      console.log(this);
      this.get('content').findNext(id);
    },
    findPrev: function(id) {

    }
  });

  // Views

  EmberInstagram.MediaView = Ember.View.extend({
    didInsertElement: function() {
      setTimeout(function() {
        this.$('.photo-feed').imagesLoaded( function( $images, $proper, $broken ) {
          $('.photo-feed .span4').wookmark({
            align: 'left',
            container: $('.photo-feed'),
            offset: 19
          });
        });
        $('.user-photo').each(function(index) {
          $(this).css('margin-left', $(this).outerWidth()/-2);
        });
      }, 2000);

      

    },
    click: function(event) {

      // Transition zoom image on click
      // var $image = this.$().find('.active .image-container'),
      //     offset = $image.offset(),
      //     height = $image.height(),
      //     imageScale = 612/height,
      //     $window = $(window),
      //     windowHeight = $window.height(),
      //     windowWidth = $window.width(),
      //     centeredHeight = $window.height()/2 - 306,
      //     centeredWidth = $window.width()/2 - 306,
      //     destinationHeight = (offset.top - centeredHeight)/imageScale,
      //     destinationWidth = (offset.left - centeredWidth)/imageScale;

      //     console.log(centeredHeight);
      //     console.log(centeredWidth);
      //     console.log(offset.top);
      //     console.log(offset.left);

      // $image.find('img').css('transform', 'scale('+imageScale+','+imageScale+') translate3d(-'+destinationHeight+'px, -'+destinationWidth+'px,0)');

      
    }
  });

  EmberInstagram.LinkView = Ember.View.extend({
    classNames: ['link-view'],
    isEnabled: false,
    classNameBindings: ['isEnabled:enabled:disabled'],
    didInsertElement: function() {
      var self=this;
      

      this.$().imagesLoaded( function( $images, $proper, $broken ) {

        $('body').addClass('open-modal');

        self.set('isEnabled', true);

        
        
        // console.log(self.isEnabled);

        // videojs("example_video_1", {}, function(){
        //   // Player (this) is initialized and ready.
        // });

      });

      $('body').on('keydown', function(event) {
        if(event.keyCode == 37) { // left
          
          self.get('controller').previousPost();
        }
        else if(event.keyCode == 39) { // right
          self.get('controller').nextPost();
        }
      });

    },
    willDestroyElement: function() {
      console.log('DESTROYED');
      $('body').off('keydown');
      $('body').removeClass('open-modal');
    }

  });

  // Routes below
  EmberInstagram.Router.map(function() {
    this.resource("media", { path: "/:media_id" }, function() {
      this.resource('link', { path: '/:link_id'} );
    });
  });

  EmberInstagram.LinkController = Ember.ObjectController.extend({
    needs: ['media'],

    _postAPI: function(params) {
      console.log(params);
      
      var xhr = $.ajax({
        url: 'https://api.instagram.com/v1/media/'+params.mediaId+'/likes?access_token='+ API_GLOBALS.AUTH_TOKEN,
        type: 'POST'
      });
      xhr.success(function (data) {
        console.log(data);
      });

      xhr.fail(function () {
        console.log('failed');
        
      });
      return xhr;
    },
    postComment: function() {
      console.log(API_GLOBALS.AUTH_TOKEN);
      console.log(this.get('model.id'));
      
      var someObject = {
        mediaId: this.get('model.id'),
        mediaEndpoint: '/comments'
      }
      var xhr = this._postAPI(someObject);
      
    },
    postLike: function() {

      var someObject = {
        mediaId: this.get('model.id'),
        mediaEndpoint: '/likes'
      }
      var xhr = this._postAPI(someObject);

    },

    // content: null,
    // init: function() {
    //   console.log(this.get('content'));
    //   this._super();
    // },

    nextPost: function() {
      // this.get('controllers.media').findNext(this.get('content.id'));
      this.advancePost(1);
    },
    previousPost: function() {
      this.advancePost(-1);
    },
    advancePost: function(delta) {
      var posts = EmberInstagram.Media.find('popular').get('links'),
          index = this.get('content.mediaIndex') + delta;

      if (index >= 0 && index <= posts.get('length')-1) {
        this.transitionToRoute('link', posts.objectAt(index));
      }
    }

  });

  EmberInstagram.LinkRoute = Ember.Route.extend({
    serialize: function(model) {
      return {link_id: model.get('id')};
    },

    model: function(params) {
      return EmberInstagram.Link.find(params.link_id);
    },

    setupController: function(controller, model) {
      // model.loadDetails();
      controller.set('content', model);
    },
  });

  EmberInstagram.MediaRoute = Ember.Route.extend({
    serialize: function(model) {
      return {media_id: model.get('id')};
    },

    model: function(params) {
      console.log(EmberInstagram.Media.find(params.media_id));
      
      return EmberInstagram.Media.find(params.media_id);
    },

    setupController: function(controller, model) {
      model.loadLinks();
      console.log(controller, model);
      
      controller.set('content', model);
    },
  });

  EmberInstagram.ApplicationRoute = Ember.Route.extend({
    setupController: function(c) {
      var medias = Em.A();
      photoFeeds.forEach(function (id) {
        medias.push(EmberInstagram.Media.find(id));
      });
      c.set('medias', medias);
    }

  });

  EmberInstagram.IndexRoute = Ember.Route.extend({
    redirect: function() {
      this.transitionTo('media', EmberInstagram.Media.find(photoFeeds[1]));
    }
  });

  Ember.Handlebars.registerBoundHelper('timestamp', function(context, options) {
    var formatter        = options.hash['format'] ? options.hash['format'] : 'hh:mm a MM-DD-YYYY';

    var original_date    = Ember.get(this, context); // same as ?

    var parsed_date      = moment.unix(context).startOf('hour').fromNow();
    // var formatted_date   = parsed_date.format(formatter);

    return new Handlebars.SafeString("<time datetime=" + context +">" + parsed_date + "</time>");
  });

  Ember.Handlebars.registerBoundHelper('if_gt', function(context, options) {
    if (context > options.hash.compare)
      return options.fn(this);
    return options.inverse(this);
  });

   Ember.Handlebars.registerHelper('multiply', function(context, multiplier) {
      console.log(context);
      
      return context * 100;
    });

})();
