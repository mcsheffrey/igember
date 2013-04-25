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

  var clientID = '5ee7e77d7b0b441f9cd307a5f30c92bb',
      url = 'https://api.instagram.com/v1/media/popular?client_id=' + clientID + '&callback=?';

  // Default subreddits to include
  var defaultSubreddits = [
    'aww',
    'ArchitecturePorn',
    'foodporn',
    'funny',
    'sushi',
    'RetroFuturism',
    'videos'
  ];

  window.EmberInstagram = Ember.Application.create({
    LOG_TRANSITIONS: true
  });

  EmberInstagram.Subreddit = Ember.Object.extend({
    loaded: false,
    showComments: true,
    title: function() {
      return "/r/" + this.get('id');
    }.property('id'),

    loadLinks: function() {
      if (this.get('loaded')) return;

      var subreddit = this;
      $.getJSON(url).then(function(response) {
        var links = Em.A();
        console.log(response);

        response.data.forEach(function (child) {
          console.log(child);

          links.push(EmberInstagram.SubredditLink.create(child));
        });
        subreddit.setProperties({links: links, loaded: true});
        console.log(subreddit);
        
      });
    }


  });

  EmberInstagram.Subreddit.reopenClass({
    store: {},

    find: function(id) {
      console.log(id);
      
      // if (!this.store[id]) {
        this.store = EmberInstagram.Subreddit.create();
      // }
      return this.store;
    }
  });

  // Our Link model
  EmberInstagram.SubredditLink = Ember.Object.extend({

    // Computed properties, just the Google Maps API Url for now, I'm guess there will be more here eventually
    mapUrl: function() {
      var latitude = this.get('location.latitude');
      console.log(latitude);
      var longitude = this.get('location.longitude');
      
      if (!latitude) return false;

      var url = 'background-image: url(https://maps.googleapis.com/maps/api/staticmap?center='+latitude+','+longitude+'&zoom=12&size=326x100&sensor=false)';
      return url;

    }.property('location.latitude', 'location.longitude'),

    loadDetails: function() {

      // If we have a name, we're already loaded
      console.log(this.get('name'));
      
      // if (this.get('name')) return;

      // var subreddit = this;
      // var url = "http://www.reddit.com/comments/" + this.get('id') + ".json?jsonp=?";
      // $.getJSON(url).then(function (response) {
      //   subreddit.setProperties(response[0].data.children[0].data);
      // });
    }

  });

  EmberInstagram.SubredditLink.reopenClass({
    store: {},

    find: function(id) {
      if (!this.store[id]) {
        this.store[id] = EmberInstagram.SubredditLink.create({id: id});
      }
      return this.store[id];
    }
  });

  // Controllers

  EmberInstagram.ApplicationController = Ember.Controller.extend({
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

  EmberInstagram.SubredditLinkView = Ember.View.extend({
    classNames: ['link-view'],
    isEnabled: false,
    classNameBindings: ['isEnabled:enabled:disabled'],
    didInsertElement: function() {
      var self=this;
      console.log('loaded');
      this.$().imagesLoaded( function( $images, $proper, $broken ) {
        console.log( $images.length + ' images total have been loaded' );
        console.log( $proper.length + ' properly loaded images' );
        console.log( $broken.length + ' broken images' );

        self.set('isEnabled', true);
        console.log(self.isEnabled);

      });
    }

  });

  // Routes below
  EmberInstagram.Router.map(function() {
    this.resource("subreddit", { path: "/subreddit" }, function() {
      this.route('link', { path: '/:link_id'} );
    });
  });

  EmberInstagram.SubredditLinkController = Ember.ObjectController.extend({
    needs: ['subreddit']
  });

  EmberInstagram.SubredditLinkRoute = Ember.Route.extend({
    serialize: function(model) {
      return {link_id: model.get('id')};
    },

    model: function(params) {
      console.log(params);
      
      return EmberInstagram.SubredditLink.find(params.link_id);
    },

    setupController: function(controller, model) {
      model.loadDetails();
    },
  });

  EmberInstagram.SubredditRoute = Ember.Route.extend({
    // serialize: function(model) {
    //   return {subreddit_id: model.get('id')};
    // },

    model: function(params) {
      return EmberInstagram.Subreddit.loadLinks();
    },

    // setupController: function(controller, model) {

    //   model.loadLinks();
    // },
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
      this.transitionTo('subreddit');
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
