(function (win, doc, $, undef) {
    'use strict';
    var Core = {
        Containers: {
            Body: null,
            Header: null
        },
        Init: function () {
            // set global elements
            Core.Containers.Body = $('body');
            Core.Containers.Header = $('#header');
            
            // init methods
            Core.FeatureBanner.Init();
        },
        ImagesReady: function () {
            Core.FeatureBanner.ImagesReady();
        },
        FeatureBanner: {
            Options: {
                FBanners: null,
                FBannerSelector: '.featurebanner',
                SlideSelector: '.banners .banner',
                PagdotsSelector: '.pagination .pagdot',
                IsAutoScrolling: false
            },
            Init: function () {
                var $featurebanner = null,
                    $articles = null,
                    bannerNum = 0;

                // set feature banner(s) and apply functionality based on exisiting elements
                Core.FeatureBanner.Options.FBanners = $(Core.FeatureBanner.Options.FBannerSelector);

                Core.FeatureBanner.Options.FBanners.each(function (index) {
                    $featurebanner = $(this);
                    Core.FeatureBanner.Setup($featurebanner);
                    // init nav
                    Core.FeatureBanner.InitSwipe($featurebanner);
                    Core.FeatureBanner.InitPagination($featurebanner);
                    Core.FeatureBanner.InitNavArrows($featurebanner);
                    // init autoscrolling
                    Core.FeatureBanner.Options.IsAutoScrolling = true;
                    Core.FeatureBanner.LoadFullVersion($featurebanner.find('.currentslide'));
                });
                
                // hover view artwork, hide all nav
                $featurebanner.find('.slidecontent .button').hover(
                    function(){
                        $featurebanner.addClass('viewart');
                        Core.FeatureBanner.StopAutoScrolling($featurebanner);
                    },
                    function(){
                        $featurebanner.removeClass('viewart');
                        Core.FeatureBanner.InitAutoScrolling($featurebanner);
                    }
                ).click(function () {
                    win.location.href = $featurebanner.find('.currentslide').children('a').attr('href');
                });
            },
            ImagesReady: function () {
                // apply class to fade in banner
                Core.FeatureBanner.Options.FBanners.each(function () {
                    $(this).addClass('ready');
                });
            },
            LoadFullVersion: function ($currBanner) {
                var $featurebanner = $currBanner.closest(Core.FeatureBanner.Options.FBannerSelector),
                    fullurl = $currBanner.data('fullurl'),
                    $fullImg = null;
                // stop if full img is active
                if ($currBanner.hasClass('fullurlloaded')) return;
                // kill auto rotator
                Core.FeatureBanner.Options.IsAutoScrolling = false;
                // load full img
                $fullImg = $('<img class="fullimg" >');
                $fullImg.load(function () { $currBanner.addClass('fullurlloaded'); });
                $.get(fullurl, null, function () {
                    $fullImg.one('transitionend', function (ev) {
                        // restart auto rotator
                        Core.FeatureBanner.Options.IsAutoScrolling = true;
                        Core.FeatureBanner.InitAutoScrolling($featurebanner);
                    })
                    // add class to initial transition in (applied via CSS)
                    $fullImg.attr('src', fullurl);
                });
                
                $currBanner.children('a').append($fullImg);
            },
            Setup: function ($featurebanner) {
                var $articles = $featurebanner.find(Core.FeatureBanner.Options.SlideSelector),
                    bannerNum = $articles.length;

                // apply count to $featurebanner.data
                $featurebanner.data('count', bannerNum);
                // setup data objects
                $featurebanner.data('currentslide', null);
                $featurebanner.data('nextslide', null);

                // after scroll transition
                $featurebanner.on('transitionend', function (e) {
                    var $this = $(this),
                        $target = $(e.target),
                        $currentslide = $this.data('currentslide'),
                        $nextslide = $this.data('nextslide');

                    // if target is banner element
                    if ($target.hasClass('banner')) {
                        // remove all left over classes from target and siblings
                        $target.removeClass('animate currentslide').siblings().removeClass('currentslide');
                        
                        // make next slide to current ready for next fadeout
                        if ($nextslide !== null ) {
                            $nextslide.addClass('currentslide').removeClass('nextslide');
                            // set next slide element as current in data
                            $this.data('currentslide', $nextslide);
                        }
                        
                        // empty nexslide in data
                        $this.data('nextslide', null);

                        // re-enable autoscrolling
                        Core.FeatureBanner.Options.IsAutoScrolling = true;
                        Core.FeatureBanner.InitAutoScrolling($featurebanner);
                    }
                });
            },
            InitSwipe: function ($featurebanner) {
                var $wrapper = $featurebanner.children('.banners');
                // apply swipe functionality to container, assign an ID for CSS animation
                $wrapper.data({
                    hammer: new Hammer($wrapper[0])
                });
                $wrapper.data().hammer.on('swipe', function (e) {
                    if (e.direction === 2) {
                        // swipe left
                        Core.FeatureBanner.MoveWrapper($featurebanner, 'right');
                    } else if (e.direction === 4) {
                        // swipe right
                        Core.FeatureBanner.MoveWrapper($featurebanner, 'left');
                    }
                });
            },
            InitPagination: function ($featurebanner) {
                var $pagination = $featurebanner.find('.pagination');
                if ($pagination.length > 0) {
                    $featurebanner.find(Core.FeatureBanner.Options.PagdotsSelector).click(function () {
                        Core.FeatureBanner.MoveWrapper($featurebanner, $(this).attr('data-bannerid'));
                    });
                }
            },
            InitNavArrows: function ($featurebanner) {
                var $navArrows = $featurebanner.find('.navarrows');
                if ($navArrows.length > 0) {
                    $navArrows.children('.leftarrow').click(function () {
                        Core.FeatureBanner.MoveWrapper($featurebanner, 'left');
                    });
                    $navArrows.children('.rightarrow').click(function () {
                        Core.FeatureBanner.MoveWrapper($featurebanner, 'right');
                    });
                }
            },
            InitAutoScrolling: function ($featurebanner) {
                var dataRotate = $featurebanner.data('rotate');
                if (dataRotate) {
                    Core.FeatureBanner.StopAutoScrolling($featurebanner);
                    if (Core.FeatureBanner.Options.IsAutoScrolling) {
                        $featurebanner.data('rotateInt', setInterval(Core.FeatureBanner.MoveWrapper, parseInt(dataRotate) * 1000, $featurebanner, 'right'));
                    }
                }
            },
            StopAutoScrolling: function ($featurebanner) {
                if ($featurebanner.data('rotateInt')) { clearInterval($featurebanner.data('rotateInt')); }
            },
            MoveWrapper: function ($featurebanner, val) {
                var currepageid = parseInt($featurebanner.data('bannerid')) || 1,
                    bannerNum = parseInt($featurebanner.data('count')),
                    $wrapper = $featurebanner.children('.banners'),
                    $banners = $featurebanner.find(Core.FeatureBanner.Options.SlideSelector),
                    $pagDots = $featurebanner.find(Core.FeatureBanner.Options.PagdotsSelector),
                    bannerid,
                    animVal;

                // disable autoscrolling during transition
                Core.FeatureBanner.Options.IsAutoScrolling = false;
                
                // workout correct id, with looping logic
                if (isNaN(val)) {
                    if (val === 'left') {
                        bannerid = currepageid <= 1 ? bannerNum : currepageid - 1;
                    } else if (val === 'right') {
                        bannerid = currepageid >= bannerNum ? 1 : currepageid + 1;
                    }
                } else {
                    bannerid = val;
                }
                $featurebanner.data('bannerid', bannerid);
                
                // apply classes to banners, relative to updated id
                $banners.removeClass('currentslide nextslide animate');

                $featurebanner.data('currentslide', $banners.eq(currepageid - 1).addClass('currentslide animate'));
                $featurebanner.data('nextslide', $banners.eq(bannerid - 1).addClass('nextslide'));

                // init full image loader on next slide
                Core.FeatureBanner.LoadFullVersion($banners.eq(bannerid - 1));

                // move pagdots
                $pagDots.removeClass('active');
                $pagDots.eq(bannerid - 1).addClass('active');

                // reset autorotater
                Core.FeatureBanner.InitAutoScrolling($featurebanner);
            }
        }
    };

    $(doc).ready(function () {
        Core.Init();
    });
    $(win).load(function() { 
        // images ready
        Core.ImagesReady();
    });
}(this, this.document, jQuery, undefined));