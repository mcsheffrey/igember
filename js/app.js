// Create our Application
(function () {

  // Ember.OAuth2.config = {
  //   google: {
  //     clientId: "78e0cc2b8e2440c385969867dc38b7c6",
  //     authBaseUri: 'http://localhost:8000',
  //     redirectUri: 'http://localhost:8000',
  //     scope: 'likes+comments'
  //   } 
  // }

  Ember.LOG_BINDINGS = true;

  // Default subreddits to include
  var defaultSubreddits = [
    'popular'
  ];

  window.EmberInstagram = Ember.Application.create({
    LOG_TRANSITIONS: true
  });

  EmberInstagram.Subreddit = Ember.Object.extend({
    loaded: false,
    showComments: true,
    clientID: '5ee7e77d7b0b441f9cd307a5f30c92bb',
    url: function() {
      return 'https://api.instagram.com/v1/media/'+ this.get('id') + '?client_id=' + this.clientID + '&callback=?';
    }.property('url'),

    loadLinks: function() {
      if (this.get('loaded')) return;

      var subreddit = this;
      $.getJSON(this.get('url')).then(function(response) {
        var links = Em.A(),
            linkIndex = 0;
        // console.log(response);

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
        subreddit.setProperties({links: links, loaded: true});
      });
    }


  });

  EmberInstagram.Subreddit.reopenClass({
    store: {},

    find: function(id) {
      if (!this.store[id]) {
        this.store[id] = EmberInstagram.Subreddit.create({id: id});
      }
      return this.store[id];
    }
  });

  // Our Link model
  EmberInstagram.Link = Ember.Object.extend({

    // Computed properties, just the Google Maps API Url for now, I'm guess there will be more here eventually
    mapUrl: function() {
      var latitude = this.get('location.latitude');
      // console.log(latitude);
      var longitude = this.get('location.longitude');
      
      if (!latitude) return false;

      var url = 'background-image: url(https://maps.googleapis.com/maps/api/staticmap?center='+latitude+','+longitude+'&zoom=12&size=326x100&sensor=false)';
      return url;

    }.property('location.latitude', 'location.longitude'),

    loadDetails: function() {

      // If we have a name, we're already loaded
      // console.log(this.get('id'));
      
      // if (this.get('id')) return;

      // We want to grab the single image endpoint here (requires Auth)
      // var subreddit = this;
      // var url = 'https://api.instagram.com/v1/media/popular?client_id=5ee7e77d7b0b441f9cd307a5f30c92bb&callback=?';
      // $.getJSON(url).then(function (response) {
      //   // console.log(response.data[0]);
        
      //   subreddit.setProperties(response.data[0]);
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
      return this.get('controllers.subreddit.id');
    }.property('id'),
    needs: ['subreddit'],
    disableComments: function() {
      this.get('controllers.subreddit').setProperties({showComments: false});
    },
    enableComments: function() {
      this.get('controllers.subreddit').setProperties({showComments: true});
    }
  });

  EmberInstagram.SubredditController = Ember.ObjectController.extend();

  // Views

  EmberInstagram.SubredditView = Ember.View.extend({
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
      // console.log('loaded');
      this.$().imagesLoaded( function( $images, $proper, $broken ) {
        // console.log( $images.length + ' images total have been loaded' );
        // console.log( $proper.length + ' properly loaded images' );
        // console.log( $broken.length + ' broken images' );

        self.set('isEnabled', true);
        // console.log(self.isEnabled);

      });

      $("body").keydown(function(e) {
        if(e.keyCode == 37) { // left
          console.log('left');
          this.get('LinkController').previousPost();
        }
        else if(e.keyCode == 39) { // right
          console.log('right');
          
        }
      });
    },

  });

  // Routes below
  EmberInstagram.Router.map(function() {
    this.resource("subreddit", { path: "/:subreddit_id" }, function() {
      this.resource('link', { path: '/:link_id'} );
    });
  });

  EmberInstagram.LinkController = Ember.ObjectController.extend({
    needs: ['subreddit'],
    nextPost: function() {
      this.advancePost(1);
    },
    previousPost: function() {
      this.advancePost(-1);
    },
    advancePost: function(delta) {
      var posts = EmberInstagram.Subreddit.find('popular').get('links'),
          index = this.get('content.mediaIndex') + delta;

      if (index >= 0 && index <= posts.get('length')-1) {
        this.transitionToRoute('link', posts.objectAt(index));
      }
    },
    // nextPostThumb: function() {
    //   console.log('next thumb media index', this.get('content.mediaIndex'));
      
    //   var index = this.get('content.mediaIndex') + 1;

    //   return EmberInstagram.Subreddit.find('popular').get('links').objectAt(index).get('images.thumbnail.url');
    // }.property('nextPostThumb'),
    // previousPostThumb: function() {
    //   var index = this.get('content.mediaIndex') -1;

    //   return EmberInstagram.Subreddit.find('popular').get('links').objectAt(index).get('images.thumbnail.url');
    // }.property('previousPostThumb')
  });

  EmberInstagram.LinkRoute = Ember.Route.extend({
    serialize: function(model) {
      return {link_id: model.get('id')};
    },

    model: function(params) {
      return EmberInstagram.Link.find(params.link_id);
    },

    setupController: function(controller, model) {
      model.loadDetails();
    },
  });

  EmberInstagram.SubredditRoute = Ember.Route.extend({
    serialize: function(model) {
      return {subreddit_id: model.get('id')};
    },

    model: function(params) {
      console.log(EmberInstagram.Subreddit.find(params.subreddit_id));
      
      return EmberInstagram.Subreddit.find(params.subreddit_id);
    },

    setupController: function(controller, model) {
      model.loadLinks();
    },
  });

  EmberInstagram.ApplicationRoute = Ember.Route.extend({
    setupController: function(c) {
      var subreddits = Em.A();
      defaultSubreddits.forEach(function (id) {
        subreddits.push(EmberInstagram.Subreddit.find(id));
      });
      c.set('subreddits', subreddits)
    }

  });

  EmberInstagram.IndexRoute = Ember.Route.extend({
    redirect: function() {
      this.transitionTo('subreddit', EmberInstagram.Subreddit.find(defaultSubreddits[0]));
    }
  });

  Ember.Handlebars.registerBoundHelper('timestamp', function(context, options) {
    var formatter        = options.hash['format'] ? options.hash['format'] : 'hh:mm a MM-DD-YYYY';

    var original_date    = Ember.get(this, context); // same as ?

    var parsed_date      = moment.unix(context).startOf('hour').fromNow();
    // var formatted_date   = parsed_date.format(formatter);

    return new Handlebars.SafeString("<time datetime=" + original_date +">" + parsed_date + "</time>");
  });
})();
