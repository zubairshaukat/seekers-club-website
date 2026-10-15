/*
 * The Seekers Club – site renderer.
 * Reads content from /data/*.json and builds the header, footer and the
 * dynamic parts of each page. Nothing here needs editing to update content:
 * edit the JSON files instead (see HOW-TO-UPDATE.md).
 */
( function () {
	'use strict';

	var cache = {};
	var page = document.body.getAttribute( 'data-page' ) || '';
	var params = new URLSearchParams( window.location.search );

	/* ---------------- helpers ---------------- */

	function load( name ) {
		if ( ! cache[ name ] ) {
			cache[ name ] = fetch( 'data/' + name + '.json', { cache: 'no-cache' } ).then( function ( r ) {
				if ( ! r.ok ) { throw new Error( name + '.json: ' + r.status ); }
				return r.json();
			} );
		}
		return cache[ name ];
	}

	function esc( s ) {
		return String( s == null ? '' : s ).replace( /[&<>"']/g, function ( c ) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ];
		} );
	}

	function $( sel ) { return document.querySelector( sel ); }

	function fill( sel, html ) {
		var el = $( sel );
		if ( el ) { el.innerHTML = html; }
		return el;
	}

	var MONTHS = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
	var MONTHS_LONG = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
	var DAYS = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];

	function parseDate( s ) {
		var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec( s || '' );
		return m ? new Date( +m[ 1 ], +m[ 2 ] - 1, +m[ 3 ] ) : null;
	}
	function today() {
		var d = new Date();
		return new Date( d.getFullYear(), d.getMonth(), d.getDate() );
	}
	function fmtLong( s ) {
		var d = parseDate( s );
		return d ? d.getDate() + ' ' + MONTHS_LONG[ d.getMonth() ] + ' ' + d.getFullYear() : '';
	}
	function fmtMonthYear( s ) {
		var d = parseDate( s );
		return d ? MONTHS[ d.getMonth() ] + ' ' + d.getFullYear() : '';
	}

	function icon( name ) {
		var p = {
			cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
			briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
			heart: '<path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6C19 16.5 12 21 12 21z"/>',
			calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
			pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
			phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
			mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
			image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
			users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
			menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
			play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
			facebook: '<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>',
			instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h0"/>',
			youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
			linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v0M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
			whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>'
		};
		return p[ name ] ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p[ name ] + '</svg>' : '';
	}

	function placeholder() {
		return '<div class="sc-ph">' + icon( 'image' ) + '</div>';
	}

	function img( src, alt, cls ) {
		if ( ! src ) { return placeholder(); }
		return '<img src="' + esc( src ) + '" alt="' + esc( alt || '' ) + '" loading="lazy" data-ph' + ( cls ? ' class="' + cls + '"' : '' ) + '>';
	}

	function initials( name ) {
		var parts = String( name ).replace( /^(Dr\.?|Prof\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '' ).trim().split( /\s+/ );
		return ( ( parts[ 0 ] || '' ).charAt( 0 ) + ( parts.length > 1 ? parts[ parts.length - 1 ].charAt( 0 ) : '' ) ).toUpperCase();
	}

	function tel( p ) { return 'tel:' + String( p ).replace( /[^0-9+]/g, '' ); }

	// Body lines: "## Heading" → sub-heading, "> text" → quote, anything else → paragraph.
	function para( list ) {
		return ( list || [] ).map( function ( p ) {
			p = String( p );
			if ( p.indexOf( '## ' ) === 0 ) { return '<h2>' + esc( p.slice( 3 ) ) + '</h2>'; }
			if ( p.indexOf( '> ' ) === 0 ) { return '<blockquote><p>' + esc( p.slice( 2 ) ) + '</p></blockquote>'; }
			return '<p>' + esc( p ) + '</p>';
		} ).join( '' );
	}

	function waShare( title ) {
		return 'https://wa.me/?text=' + encodeURIComponent( title + ' — ' + window.location.href );
	}

	function setMeta( title, desc ) {
		if ( title ) { document.title = title + ' – The Seekers Club'; }
		if ( desc ) {
			var m = document.querySelector( 'meta[name="description"]' );
			if ( m ) { m.setAttribute( 'content', desc ); }
		}
	}

	function hero( title, lead, dark, crumb ) {
		return '<header class="sc-page-hero' + ( dark ? ' sc-page-hero--dark' : '' ) + '"><div class="sc-wrap">' +
			( crumb ? '<div class="sc-breadcrumb">' + crumb + '</div>' : '' ) +
			'<h1>' + esc( title ) + '</h1>' + ( lead ? '<p>' + esc( lead ) + '</p>' : '' ) +
			'</div></header>';
	}

	function notFound( what, back, backLabel ) {
		return hero( what + ' not found', 'It may have been moved or removed.' ) +
			'<section class="sc-section"><div class="sc-wrap"><a class="sc-btn sc-btn--green" href="' + back + '">' + esc( backLabel ) + '</a></div></section>';
	}

	function published( list ) {
		return ( list || [] ).filter( function ( x ) { return ! x.draft; } );
	}

	// Image fall-back: broken photos become a placeholder (or initials for people).
	document.addEventListener( 'error', function ( e ) {
		var t = e.target;
		if ( ! t || t.tagName !== 'IMG' || ! t.hasAttribute( 'data-ph' ) ) { return; }
		var init = t.getAttribute( 'data-initials' );
		var div = document.createElement( 'div' );
		if ( init ) {
			div.className = 'sc-person__initials';
			div.setAttribute( 'aria-hidden', 'true' );
			div.textContent = init;
		} else {
			div.className = 'sc-ph';
			div.innerHTML = icon( 'image' );
		}
		t.replaceWith( div );
	}, true );

	/* ---------------- header & footer ---------------- */

	function currentFile() {
		var f = window.location.pathname.split( '/' ).pop() || 'index.html';
		return f;
	}

	function isCurrent( url ) {
		var file = url.split( '?' )[ 0 ];
		var cur = currentFile();
		if ( file === cur ) {
			if ( url.indexOf( '?' ) === -1 ) { return true; }
			return window.location.search === '?' + url.split( '?' )[ 1 ];
		}
		var map = { 'event.html': 'events.html', 'album.html': 'gallery.html', 'story.html': 'stories.html' };
		return map[ cur ] === file;
	}

	function linkAttrs( it ) {
		return 'href="' + esc( it.url ) + '"' + ( it.newTab ? ' target="_blank" rel="noopener"' : '' );
	}

	function menuHtml( items ) {
		return '<ul class="sc-menu">' + items.map( function ( it ) {
			if ( it.mega && it.mega.length ) {
				var all = [];
				it.mega.forEach( function ( col ) { all = all.concat( col.items || [] ); } );
				var megaCur = isCurrent( it.url ) || all.some( function ( c ) { return isCurrent( c.url ); } );
				return '<li class="sc-has-mega' + ( megaCur ? ' current-menu-item' : '' ) + '"><a href="' + esc( it.url ) + '" aria-haspopup="true"' + ( megaCur ? ' aria-current="page"' : '' ) + '>' + esc( it.label ) + '</a>' +
					'<div class="sc-mega"><div class="sc-mega__inner">' + it.mega.map( function ( col ) {
						return '<div class="sc-mega__col"><span class="sc-mega__heading">' + esc( col.heading ) + '</span><ul>' +
							( col.items || [] ).map( function ( c ) {
								return '<li' + ( isCurrent( c.url ) ? ' class="current-menu-item"' : '' ) + '><a ' + linkAttrs( c ) + '>' + esc( c.label ) + '</a></li>';
							} ).join( '' ) + '</ul></div>';
					} ).join( '' ) + '</div></div></li>';
			}
			var cur = isCurrent( it.url ) || ( it.children || [] ).some( function ( c ) { return isCurrent( c.url ); } );
			var sub = it.children && it.children.length ?
				'<ul class="sub-menu">' + it.children.map( function ( c ) {
					return '<li' + ( isCurrent( c.url ) ? ' class="current-menu-item"' : '' ) + '><a href="' + esc( c.url ) + '">' + esc( c.label ) + '</a></li>';
				} ).join( '' ) + '</ul>' : '';
			return '<li class="' + ( cur ? 'current-menu-item' : '' ) + '"><a href="' + esc( it.url ) + '"' + ( cur ? ' aria-current="page"' : '' ) + '>' + esc( it.label ) + '</a>' + sub + '</li>';
		} ).join( '' ) + '</ul>';
	}

	function renderHeader( s ) {
		var c = s.contact || {};
		var topPhone = c.phoneAlt || c.phone;
		var brand = s.logo ?
			'<a class="sc-brand" href="index.html" rel="home"><img src="' + esc( s.logo ) + '" alt="' + esc( s.name ) + '" width="160" height="56"></a>' :
			'<a class="sc-brand" href="index.html" rel="home"><span class="sc-brand__mark" aria-hidden="true">TS</span><span class="sc-brand__text"><span class="sc-brand__name">' + esc( s.name ) + '</span><span class="sc-brand__tag">' + esc( s.tagline ) + '</span></span></a>';

		fill( '#sc-header',
			'<a class="screen-reader-text" href="#sc-main">Skip to content</a>' +
			'<div class="sc-topbar"><div class="sc-wrap"><span>' + esc( s.topBar ) + '</span><div class="sc-topbar__links">' +
				( topPhone ? '<a href="' + tel( topPhone ) + '">' + esc( topPhone ) + '</a>' : '' ) +
				( s.social && s.social.whatsapp ? '<a href="' + esc( s.social.whatsapp ) + '" target="_blank" rel="noopener">WhatsApp Channel</a>' : '' ) +
				'<a href="' + esc( s.links.member ) + '">Become a member</a>' +
			'</div></div></div>' +
			'<header class="sc-header"><div class="sc-wrap">' + brand +
				'<button class="sc-menu-toggle" type="button" aria-expanded="false" aria-controls="sc-nav">' + icon( 'menu' ) + '<span>Menu</span></button>' +
				'<nav class="sc-nav" id="sc-nav" aria-label="Main">' + menuHtml( s.menu || [] ) +
					'<div class="sc-header__cta"><a class="sc-btn sc-btn--outline" href="' + esc( s.links.volunteer ) + '">Volunteer</a>' +
					'<a class="sc-btn sc-btn--accent" href="' + esc( s.links.donate ) + '">Donate</a></div>' +
				'</nav>' +
			'</div></header>'
		);

		var toggle = $( '.sc-menu-toggle' );
		var nav = $( '#sc-nav' );
		toggle.addEventListener( 'click', function () {
			var open = nav.classList.toggle( 'is-open' );
			toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' && nav.classList.contains( 'is-open' ) ) {
				nav.classList.remove( 'is-open' );
				toggle.setAttribute( 'aria-expanded', 'false' );
				toggle.focus();
			}
		} );
	}

	function socialHtml( s, onLight ) {
		var nets = [ 'facebook', 'instagram', 'youtube', 'linkedin', 'whatsapp' ];
		var style = onLight ? ' style="border-color:var(--sc-line-strong);color:var(--sc-green)"' : '';
		return '<div class="sc-social">' + nets.filter( function ( n ) { return s.social && s.social[ n ]; } ).map( function ( n ) {
			return '<a href="' + esc( s.social[ n ] ) + '" target="_blank" rel="noopener" aria-label="' + n.charAt( 0 ).toUpperCase() + n.slice( 1 ) + '"' + style + '>' + icon( n ) + '</a>';
		} ).join( '' ) + '</div>';
	}

	function renderFooter( s ) {
		var c = s.contact || {};
		fill( '#sc-footer',
			'<footer class="sc-footer"><div class="sc-wrap sc-footer__grid">' +
				'<div><span class="sc-footer__name">' + esc( s.name ) + '</span><p>' + esc( s.footerAbout ) + '</p>' +
				'<a class="sc-btn sc-btn--accent" href="' + esc( s.links.donate ) + '">Donate</a></div>' +
				'<div><h3>Quick links</h3><ul>' + ( s.footerLinks || [] ).map( function ( l ) {
					return '<li><a href="' + esc( l.url ) + '">' + esc( l.label ) + '</a></li>';
				} ).join( '' ) + '</ul></div>' +
				'<div><h3>Visit us</h3><p>' + esc( c.address ).replace( /\n/g, '<br>' ) + '</p></div>' +
				'<div><h3>Contact</h3><ul>' +
					( c.phone ? '<li><a href="' + tel( c.phone ) + '">' + esc( c.phone ) + '</a></li>' : '' ) +
					( c.email ? '<li><a href="mailto:' + esc( c.email ) + '">' + esc( c.email ) + '</a></li>' : '' ) +
				'</ul><div style="margin-top:16px">' + socialHtml( s ) + '</div></div>' +
			'</div><div class="sc-wrap sc-footer__bottom"><span>&copy; ' + new Date().getFullYear() + ' ' + esc( s.name ) + '. All rights reserved.</span>' +
				( s.credit && s.credit.label ? '<span>Website by <a href="' + esc( s.credit.url ) + '" target="_blank" rel="noopener">' + esc( s.credit.label ) + '</a></span>' : '' ) +
			'</div></footer>'
		);
	}

	/* ---------------- shared blocks ---------------- */

	function eventIsPast( ev ) {
		var d = parseDate( ev.endDate || ev.date );
		return d ? d < today() : false;
	}

	function sortEvents( list, past ) {
		return list.filter( function ( e ) { return eventIsPast( e ) === past; } ).sort( function ( a, b ) {
			return past ? ( b.date || '' ).localeCompare( a.date || '' ) : ( a.date || '9999' ).localeCompare( b.date || '9999' );
		} );
	}

	function dateBox( s ) {
		var d = parseDate( s );
		return '<div class="sc-event__date"><small>' + ( d ? MONTHS[ d.getMonth() ] : 'Date' ) + '</small><strong>' + ( d ? d.getDate() : 'TBA' ) + '</strong></div>';
	}

	function eventWhen( ev ) {
		var d = parseDate( ev.date );
		if ( ! d ) { return 'Date to be announced'; }
		var out = DAYS[ d.getDay() ] + ', ' + fmtLong( ev.date );
		if ( ev.endDate && ev.endDate !== ev.date ) { out += ' – ' + fmtLong( ev.endDate ); }
		if ( ev.time ) { out += ' · ' + ev.time; }
		return out;
	}

	function gcal( ev ) {
		var d = parseDate( ev.date );
		if ( ! d ) { return ''; }
		var end = parseDate( ev.endDate ) || d;
		end = new Date( end.getFullYear(), end.getMonth(), end.getDate() + 1 );
		function f( x ) { return x.getFullYear() + String( x.getMonth() + 1 ).padStart( 2, '0' ) + String( x.getDate() ).padStart( 2, '0' ); }
		return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent( ev.title ) +
			'&dates=' + f( d ) + '/' + f( end ) + '&location=' + encodeURIComponent( ev.venue || '' ) +
			'&details=' + encodeURIComponent( ev.summary || '' );
	}

	function eventRow( ev ) {
		var past = eventIsPast( ev );
		var where = [ ev.time, ev.venue ].filter( Boolean ).join( ' · ' );
		var url = 'event.html?id=' + encodeURIComponent( ev.id );
		return '<article class="sc-event' + ( past ? ' sc-event--past' : '' ) + '">' + dateBox( ev.date ) +
			'<div class="sc-event__info">' + ( ev.type ? '<span class="sc-event__tag">' + esc( ev.type ) + '</span>' : '' ) +
			'<h3 class="sc-event__title"><a href="' + url + '">' + esc( ev.title ) + '</a></h3>' +
			( where ? '<span class="sc-event__where">' + esc( where ) + '</span>' : '' ) + '</div>' +
			'<a class="sc-btn sc-btn--outline" href="' + url + '">' + ( past ? 'See more' : 'Details' ) + '<span class="screen-reader-text"> — ' + esc( ev.title ) + '</span></a></article>';
	}

	function albumCard( al ) {
		var p = al.photos || [];
		var cover = al.cover || p[ 0 ];
		var rest = p.filter( function ( x ) { return x !== cover; } );
		var meta = [ al.type, fmtMonthYear( al.date ) ].filter( Boolean ).join( ' · ' );
		var cell = function ( src ) { return '<div>' + ( src ? img( src, '' ) : '' ) + '</div>'; };
		return '<a class="sc-album" href="album.html?id=' + encodeURIComponent( al.id ) + '">' +
			'<div class="sc-album__mosaic"><div class="sc-album__cover">' + img( cover, '' ) + '</div>' +
			cell( rest[ 0 ] ) + cell( rest[ 1 ] ) +
			( p.length > 4 ? '<div class="sc-album__more">+' + ( p.length - 3 ) + '</div>' : cell( rest[ 2 ] ) ) + '</div>' +
			'<div class="sc-album__body">' + ( meta ? '<span class="sc-album__meta">' + esc( meta ) + '</span>' : '' ) +
			'<span class="sc-album__title">' + esc( al.title ) + '</span>' +
			'<span class="sc-album__count">' + p.length + ( p.length === 1 ? ' photo' : ' photos' ) + '</span></div></a>';
	}

	function storyCard( st ) {
		var url = 'story.html?id=' + encodeURIComponent( st.id );
		var meta = [ st.category, fmtLong( st.date ) ].filter( Boolean ).join( ' · ' );
		return '<article class="sc-post"><a class="sc-post__img" href="' + url + '" tabindex="-1" aria-hidden="true">' + img( st.image, '' ) + '</a>' +
			'<div class="sc-post__body">' + ( meta ? '<span class="sc-post__meta">' + esc( meta ) + '</span>' : '' ) +
			'<h3 class="sc-post__title"><a href="' + url + '">' + esc( st.title ) + '</a></h3>' +
			'<div class="sc-post__excerpt">' + esc( st.summary ) + '</div></div></article>';
	}

	function photoGrid( photos, title ) {
		return '<div class="sc-photos" data-sc-lightbox>' + photos.map( function ( p, i ) {
			return '<a href="' + esc( p ) + '" data-sc-photo>' + img( p, ( title ? title + ' – photo ' + ( i + 1 ) : '' ) ) + '</a>';
		} ).join( '' ) + '</div>';
	}

	function emptyBox( title, text, s, extraBtn ) {
		return '<div class="sc-empty"><h3>' + esc( title ) + '</h3><p>' + esc( text ) + '</p><div class="sc-btns" style="justify-content:center">' +
			( s.social && s.social.whatsapp ? '<a class="sc-btn sc-btn--green" href="' + esc( s.social.whatsapp ) + '" target="_blank" rel="noopener">Follow on WhatsApp</a>' : '' ) +
			( extraBtn || '' ) + '</div></div>';
	}

	function hasPhotos( al ) { return ( al.photos || [] ).length > 0; }

	function byDateDesc( a, b ) { return ( b.date || '' ).localeCompare( a.date || '' ); }

	/* ---------------- pages ---------------- */

	var pages = {};

	pages.home = function ( s ) {
		var h = s.hero || {};
		fill( '#home-hero',
			'<div class="sc-wrap"><div class="sc-hero__copy"><span class="sc-eyebrow">' + esc( h.eyebrow ) + '</span>' +
			'<h1>' + esc( h.title ) + '</h1><p class="sc-hero__lead">' + esc( h.text ) + '</p>' +
			'<div class="sc-btns"><a class="sc-btn sc-btn--accent" href="' + esc( s.links.donate ) + '">Donate now</a>' +
			'<a class="sc-btn sc-btn--outline-light" href="events.html">See upcoming events</a></div></div>' +
			'<div class="sc-hero__media"><div class="sc-hero__img sc-hero__img--tall">' + img( h.image1, '' ) + '</div>' +
			'<div class="sc-hero__img">' + img( h.image2, '' ) + '</div>' +
			'<div class="sc-hero__badge"><strong>' + esc( h.badgeBig ) + '</strong><span>' + esc( h.badgeSmall ) + '</span></div></div></div>'
		);

		var stats = ( s.stats || [] ).filter( function ( x ) { return x.number; } );
		if ( stats.length ) {
			var el = fill( '#home-stats', '<div class="sc-wrap"><div class="sc-stats">' + stats.map( function ( x ) {
				return '<div class="sc-stat"><strong>' + esc( x.number ) + '</strong><span>' + esc( x.label ) + '</span></div>';
			} ).join( '' ) + '</div></div>' );
			el.hidden = false;
		}

		var f = s.founder || {};
		if ( f.quote ) {
			var fe = fill( '#home-founder', '<div class="sc-wrap"><div class="sc-founder"><div class="sc-founder__img">' + img( f.image, f.name ) + '</div>' +
				'<div class="sc-founder__body"><span class="sc-eyebrow">A message from our founder</span><blockquote>' + esc( f.quote ) + '</blockquote>' +
				'<strong>' + esc( f.name ) + '</strong><br><span style="color:var(--sc-muted)">' + esc( f.role ) + '</span>' +
				'<p style="margin-top:16px"><a href="people.html?group=team" style="font-weight:700">Meet our team →</a></p></div></div></div>' );
			fe.hidden = false;
		}

		load( 'events' ).then( function ( d ) {
			var up = sortEvents( published( d.events ), false ).slice( 0, 3 );
			fill( '#home-events', up.length ? '<div class="sc-events-list">' + up.map( eventRow ).join( '' ) + '</div>' :
				emptyBox( 'New events are being planned', 'Follow our WhatsApp channel to hear first about counselling sessions, relief drives and plantation days.', s,
					'<a class="sc-btn sc-btn--outline" href="events.html?when=past">See past events</a>' ) );
		} );

		load( 'albums' ).then( function ( d ) {
			var list = published( d.albums ).filter( hasPhotos ).sort( byDateDesc ).slice( 0, 4 );
			if ( ! list.length ) { return; }
			fill( '#home-gallery-strip', list.map( function ( al ) {
				return '<a href="album.html?id=' + encodeURIComponent( al.id ) + '">' + img( al.cover || ( al.photos || [] )[ 0 ], '' ) + '<span>' + esc( al.title ) + '</span></a>';
			} ).join( '' ) );
			$( '#home-gallery' ).hidden = false;
		} );

		load( 'stories' ).then( function ( d ) {
			var list = published( d.stories ).slice( 0, 3 );
			fill( '#home-stories', list.map( storyCard ).join( '' ) );
		} );
	};

	pages.events = function ( s ) {
		var when = params.get( 'when' ) === 'past' ? 'past' : 'upcoming';
		var type = params.get( 'type' ) || '';
		load( 'events' ).then( function ( d ) {
			var all = published( d.events );
			var types = [];
			all.forEach( function ( e ) { if ( e.type && types.indexOf( e.type ) === -1 ) { types.push( e.type ); } } );
			var list = sortEvents( all, when === 'past' ).filter( function ( e ) { return ! type || e.type === type; } );

			function link( w, t ) {
				var q = [];
				if ( w === 'past' ) { q.push( 'when=past' ); }
				if ( t ) { q.push( 'type=' + encodeURIComponent( t ) ); }
				return 'events.html' + ( q.length ? '?' + q.join( '&' ) : '' );
			}

			var html = '<div class="sc-filters"><div class="sc-chips" role="group" aria-label="Show">' +
				'<a class="sc-chip sc-chip--big' + ( when === 'upcoming' ? ' is-active" aria-current="page' : '' ) + '" href="' + link( 'upcoming', type ) + '">Upcoming</a>' +
				'<a class="sc-chip sc-chip--big' + ( when === 'past' ? ' is-active" aria-current="page' : '' ) + '" href="' + link( 'past', type ) + '">Past events</a></div>';
			if ( types.length ) {
				html += '<div class="sc-chips" role="group" aria-label="Filter by type"><a class="sc-chip' + ( type ? '' : ' is-active' ) + '" href="' + link( when, '' ) + '">All</a>' +
					types.map( function ( t ) { return '<a class="sc-chip' + ( t === type ? ' is-active' : '' ) + '" href="' + link( when, t ) + '">' + esc( t ) + '</a>'; } ).join( '' ) + '</div>';
			}
			html += '</div>';

			if ( ! list.length ) {
				html += when === 'upcoming' ?
					emptyBox( 'No upcoming events right now', 'New drives and sessions are announced first on our WhatsApp channel.', s, '<a class="sc-btn sc-btn--outline" href="gallery.html">Open gallery</a>' ) :
					emptyBox( 'No past events listed yet', 'Browse the gallery and stories for our earlier work.', s, '<a class="sc-btn sc-btn--outline" href="stories.html">Read stories</a>' );
			} else {
				if ( when === 'upcoming' ) {
					var ev = list.shift();
					html += '<article class="sc-featured-event"><div class="sc-featured-event__img">' + img( ev.image, '' ) + '</div>' +
						'<div class="sc-featured-event__body"><span class="sc-eyebrow" style="margin:0">Next event' + ( ev.type ? ' · ' + esc( ev.type ) : '' ) + '</span>' +
						'<h2 style="margin:0"><a href="event.html?id=' + encodeURIComponent( ev.id ) + '" style="color:inherit;text-decoration:none">' + esc( ev.title ) + '</a></h2>' +
						'<div class="sc-featured-event__facts"><span>' + icon( 'calendar' ) + esc( eventWhen( ev ) ) + '</span>' +
						( ev.venue ? '<span>' + icon( 'pin' ) + esc( ev.venue ) + '</span>' : '' ) + '</div>' +
						( ev.summary ? '<p style="margin:0;color:var(--sc-muted)">' + esc( ev.summary ) + '</p>' : '' ) +
						'<div class="sc-btns" style="margin-top:6px"><a class="sc-btn sc-btn--green" href="' + esc( ev.registerUrl || ( 'event.html?id=' + encodeURIComponent( ev.id ) ) ) + '">' + ( ev.registerUrl ? 'Register' : 'Details' ) + '</a>' +
						( gcal( ev ) ? '<a class="sc-btn sc-btn--outline" href="' + esc( gcal( ev ) ) + '" target="_blank" rel="noopener">Add to calendar</a>' : '' ) +
						'<a class="sc-btn sc-btn--outline" href="https://wa.me/?text=' + encodeURIComponent( ev.title + ' — ' + new URL( 'event.html?id=' + ev.id, window.location.href ).href ) + '" target="_blank" rel="noopener">Share on WhatsApp</a></div></div></article>';
				}
				var month = '';
				list.forEach( function ( e ) {
					var d = parseDate( e.date );
					var m = d ? MONTHS_LONG[ d.getMonth() ] + ' ' + d.getFullYear() : 'Date to be announced';
					if ( m !== month ) {
						html += ( month ? '</div>' : '' ) + '<h2 class="sc-events-month">' + esc( m ) + '</h2><div class="sc-events-list">';
						month = m;
					}
					html += eventRow( e );
				} );
				if ( month ) { html += '</div>'; }
			}
			fill( '#events', html );
		} );
	};

	pages.event = function ( s ) {
		var id = params.get( 'id' );
		Promise.all( [ load( 'events' ), load( 'albums' ), load( 'stories' ) ] ).then( function ( r ) {
			var ev = published( r[ 0 ].events ).filter( function ( e ) { return e.id === id; } )[ 0 ];
			if ( ! ev ) { fill( '#sc-main', notFound( 'Event', 'events.html', 'All events' ) ); return; }
			setMeta( ev.title, ev.summary );
			var past = eventIsPast( ev );
			var album = ev.album ? published( r[ 1 ].albums ).filter( function ( a ) { return a.id === ev.album; } )[ 0 ] : null;
			var reg = ev.registerUrl || s.links.volunteer;
			var evStory = published( r[ 2 ].stories ).filter( function ( x ) { return x.id === ev.id || ( ev.album && x.album === ev.album ); } )[ 0 ];
			var crumb = '<a href="events.html">Events</a>' + ( past ? ' / <a href="events.html?when=past">Past</a>' : '' );
			fill( '#sc-main',
				hero( ev.title, ( ev.type ? ev.type + ' · ' : '' ) + eventWhen( ev ), false, crumb ) +
				'<section class="sc-section"><div class="sc-wrap sc-layout"><article class="sc-layout__main">' +
					( ev.image ? '<div class="sc-featured-img">' + img( ev.image, ev.title ) + '</div>' : '' ) +
					'<div class="sc-entry">' + ( ev.summary ? '<p class="sc-lead">' + esc( ev.summary ) + '</p>' : '' ) + para( ev.body ) + '</div>' +
					( evStory ? '<p style="margin-top:24px"><a class="sc-btn sc-btn--green" href="story.html?id=' + encodeURIComponent( evStory.id ) + '">Read the full story</a></p>' : '' ) +
					( album && album.photos && album.photos.length ? '<h2 style="margin-top:40px">Photos</h2>' + photoGrid( album.photos.slice( 0, 8 ), album.title ) +
						'<p style="margin-top:16px"><a class="sc-btn sc-btn--outline" href="album.html?id=' + encodeURIComponent( album.id ) + '">See the full album</a></p>' : '' ) +
				'</article><aside class="sc-layout__side"><div class="sc-box"><h3>' + ( past ? 'This event has ended' : 'Event details' ) + '</h3><dl>' +
					'<dt>When</dt><dd>' + esc( eventWhen( ev ) ) + '</dd>' +
					( ev.venue ? '<dt>Where</dt><dd>' + esc( ev.venue ) + ( ev.mapUrl ? '<br><a href="' + esc( ev.mapUrl ) + '" target="_blank" rel="noopener">Open in Google Maps</a>' : '' ) + '</dd>' : '' ) +
					'</dl><div class="sc-btns" style="margin-top:20px;flex-direction:column">' +
					( past ? '' : '<a class="sc-btn sc-btn--green" href="' + esc( reg ) + '">' + ( ev.registerUrl ? 'Register' : 'Register / volunteer' ) + '</a>' +
						( gcal( ev ) ? '<a class="sc-btn sc-btn--outline" href="' + esc( gcal( ev ) ) + '" target="_blank" rel="noopener">Add to calendar</a>' : '' ) ) +
					'<a class="sc-btn sc-btn--outline" href="' + esc( waShare( ev.title ) ) + '" target="_blank" rel="noopener">Share on WhatsApp</a></div></div>' +
					'<div class="sc-box"><h3>Help make it happen</h3><p style="color:var(--sc-muted)">Every drive is run by volunteers and funded by donors like you.</p>' +
					'<a class="sc-btn sc-btn--accent" href="' + esc( s.links.donate ) + '">Donate</a></div></aside></div></section>'
			);
			initLightbox();
		} );
	};

	pages.gallery = function () {
		var type = params.get( 'type' ) || '';
		var yr = params.get( 'yr' ) || '';
		load( 'albums' ).then( function ( d ) {
			var all = published( d.albums ).filter( hasPhotos ).sort( byDateDesc );
			var types = [];
			var years = [];
			all.forEach( function ( a ) {
				if ( a.type && types.indexOf( a.type ) === -1 ) { types.push( a.type ); }
				var y = ( a.date || '' ).slice( 0, 4 );
				if ( y && years.indexOf( y ) === -1 ) { years.push( y ); }
			} );
			var list = all.filter( function ( a ) {
				return ( ! type || a.type === type ) && ( ! yr || ( a.date || '' ).slice( 0, 4 ) === yr );
			} );
			function link( t, y ) {
				var q = [];
				if ( t ) { q.push( 'type=' + encodeURIComponent( t ) ); }
				if ( y ) { q.push( 'yr=' + y ); }
				return 'gallery.html' + ( q.length ? '?' + q.join( '&' ) : '' );
			}
			var html = '<div class="sc-filters">';
			if ( types.length ) {
				html += '<div class="sc-chips" role="group" aria-label="Filter by type"><a class="sc-chip' + ( type ? '' : ' is-active' ) + '" href="' + link( '', yr ) + '">All</a>' +
					types.map( function ( t ) { return '<a class="sc-chip' + ( t === type ? ' is-active' : '' ) + '" href="' + link( t, yr ) + '">' + esc( t ) + '</a>'; } ).join( '' ) + '</div>';
			}
			if ( years.length > 1 ) {
				years.sort().reverse();
				html += '<div class="sc-chips" role="group" aria-label="Filter by year"><a class="sc-chip' + ( yr ? '' : ' is-active' ) + '" href="' + link( type, '' ) + '">All years</a>' +
					years.map( function ( y ) { return '<a class="sc-chip' + ( y === yr ? ' is-active' : '' ) + '" href="' + link( type, y ) + '">' + y + '</a>'; } ).join( '' ) + '</div>';
			}
			html += '</div>';
			html += list.length ? '<div class="sc-grid">' + list.map( albumCard ).join( '' ) + '</div>' :
				'<div class="sc-empty"><h3>No albums here yet</h3><p>Try another filter, or check back after our next drive.</p></div>';
			fill( '#gallery', html );
		} );
	};

	pages.album = function ( s ) {
		var id = params.get( 'id' );
		Promise.all( [ load( 'albums' ), load( 'stories' ), load( 'events' ) ] ).then( function ( r ) {
			var al = published( r[ 0 ].albums ).filter( function ( a ) { return a.id === id; } )[ 0 ];
			if ( ! al ) { fill( '#sc-main', notFound( 'Album', 'gallery.html', 'All albums' ) ); return; }
			setMeta( al.title, al.description );
			var photos = al.photos || [];
			var story = al.story ? published( r[ 1 ].stories ).filter( function ( x ) { return x.id === al.story; } )[ 0 ] : null;
			var ev = published( r[ 2 ].events ).filter( function ( e ) { return e.album === al.id; } )[ 0 ];
			var meta = [ al.type, fmtMonthYear( al.date ), photos.length + ( photos.length === 1 ? ' photo' : ' photos' ) ].filter( Boolean ).join( ' · ' );
			fill( '#sc-main',
				hero( al.title, meta, true, '<a href="gallery.html">Gallery</a>' ) +
				'<section class="sc-section"><div class="sc-wrap">' +
					( al.description ? '<p class="sc-lead" style="max-width:780px;margin-bottom:32px">' + esc( al.description ) + '</p>' : '' ) +
					( photos.length ? photoGrid( photos, al.title ) : '<div class="sc-empty"><p>Photos are being added to this album.</p></div>' ) +
					'<div class="sc-share">' +
						( story ? '<a class="sc-btn sc-btn--green" href="story.html?id=' + encodeURIComponent( story.id ) + '">Read the story</a>' : '' ) +
						( ev ? '<a class="sc-btn sc-btn--outline" href="event.html?id=' + encodeURIComponent( ev.id ) + '">Event details</a>' : '' ) +
						'<a class="sc-btn sc-btn--outline" href="' + esc( waShare( al.title ) ) + '" target="_blank" rel="noopener">Share on WhatsApp</a>' +
						'<a class="sc-btn sc-btn--outline" href="gallery.html">All albums</a>' +
					'</div></div></section>'
			);
			initLightbox();
		} );
	};

	pages.stories = function () {
		load( 'stories' ).then( function ( d ) {
			var list = published( d.stories );
			fill( '#stories', list.length ? '<div class="sc-grid">' + list.map( storyCard ).join( '' ) + '</div>' : '<div class="sc-empty"><p>No stories yet.</p></div>' );
		} );
	};

	pages.story = function () {
		var id = params.get( 'id' );
		Promise.all( [ load( 'stories' ), load( 'albums' ) ] ).then( function ( r ) {
			var all = published( r[ 0 ].stories );
			var st = all.filter( function ( x ) { return x.id === id; } )[ 0 ];
			if ( ! st ) { fill( '#sc-main', notFound( 'Story', 'stories.html', 'All stories' ) ); return; }
			setMeta( st.title, st.summary );
			var album = st.album ? published( r[ 1 ].albums ).filter( function ( a ) { return a.id === st.album; } )[ 0 ] : null;
			var more = all.filter( function ( x ) { return x.id !== st.id; } ).slice( 0, 3 );
			var crumb = '<a href="stories.html">Stories</a>' + ( st.category ? ' / ' + esc( st.category ) : '' );
			fill( '#sc-main',
				hero( st.title, fmtLong( st.date ), false, crumb ) +
				'<section class="sc-section"><div class="sc-wrap"><article class="sc-content">' +
					( st.image ? '<div class="sc-featured-img">' + img( st.image, st.title ) + '</div>' : '' ) +
					'<div class="sc-entry">' + para( st.body ) + '</div>' +
					( album && album.photos && album.photos.length > 1 ? '<div class="sc-box" style="margin-top:32px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between"><strong>See all ' + album.photos.length + ' photos from this activity</strong><a class="sc-btn sc-btn--green" href="album.html?id=' + encodeURIComponent( album.id ) + '">Open album</a></div>' : '' ) +
					'<div class="sc-share"><strong>Share</strong><a class="sc-btn sc-btn--outline" href="' + esc( waShare( st.title ) ) + '" target="_blank" rel="noopener">WhatsApp</a>' +
					'<a class="sc-btn sc-btn--outline" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent( window.location.href ) + '" target="_blank" rel="noopener">Facebook</a></div>' +
				'</article></div></section>' +
				( more.length ? '<section class="sc-section" style="padding-top:0"><div class="sc-wrap"><h2>More stories</h2><div class="sc-grid">' + more.map( storyCard ).join( '' ) + '</div></div></section>' : '' )
			);
		} );
	};

	pages.people = function ( s ) {
		var group = params.get( 'group' ) || 'team';
		load( 'people' ).then( function ( d ) {
			var g = ( d.groups || {} )[ group ] || d.groups.team;
			if ( ! d.groups[ group ] ) { group = 'team'; }
			setMeta( g.title, g.lead );
			var people = published( d.people ).filter( function ( p ) { return p.group === group; } );
			var tabs = Object.keys( d.groups ).map( function ( k ) {
				return '<a class="sc-chip sc-chip--big' + ( k === group ? ' is-active" aria-current="page' : '' ) + '" href="people.html?group=' + k + '">' + esc( k.charAt( 0 ).toUpperCase() + k.slice( 1 ) ) + '</a>';
			} ).join( '' );
			fill( '#sc-main',
				hero( g.title, g.lead ) +
				'<section class="sc-section"><div class="sc-wrap"><nav class="sc-chips" aria-label="Our people" style="margin-bottom:32px">' + tabs + '</nav>' +
				'<div class="sc-grid sc-grid--people">' + people.map( function ( p ) {
					var photo = p.photo ? '<img src="' + esc( p.photo ) + '" alt="' + esc( p.name ) + '" loading="lazy" data-ph data-initials="' + esc( initials( p.name ) ) + '">' :
						'<div class="sc-person__initials" aria-hidden="true">' + esc( initials( p.name ) ) + '</div>';
					return '<article class="sc-person"><div class="sc-person__img">' + photo + '</div><div class="sc-person__body">' +
						'<h3 class="sc-person__name">' + esc( p.name ) + '</h3>' + ( p.role ? '<span class="sc-person__role">' + esc( p.role ) + '</span>' : '' ) +
						( p.bio ? '<div class="sc-person__bio"><p>' + esc( p.bio ) + '</p></div>' : '' ) + '</div></article>';
				} ).join( '' ) + '</div>' +
				( group === 'volunteers' ? '<div class="sc-cta" style="margin-top:48px"><div class="sc-cta__copy"><h2>Become a volunteer</h2><p>Give a few hours to a relief drive, a plantation day or a counselling session.</p></div><a class="sc-btn sc-btn--dark" href="' + esc( s.links.volunteer ) + '">Join the volunteers</a></div>' : '' ) +
				'</div></section>'
			);
		} );
	};

	pages.youth = function () {
		load( 'videos' ).then( function ( d ) {
			var v = published( d.videos );
			if ( ! v.length ) { return; }
			fill( '#videos', v.map( function ( x, i ) {
				var label = x.title || ( 'Counselling video ' + ( i + 1 ) );
				return '<button type="button" class="sc-video" data-yt="' + esc( x.youtube ) + '" aria-label="Play: ' + esc( label ) + '">' +
					'<img src="https://i.ytimg.com/vi/' + esc( x.youtube ) + '/hqdefault.jpg" alt="" loading="lazy">' + icon( 'play' ) +
					( x.title ? '<span>' + esc( x.title ) + '</span>' : '' ) + '</button>';
			} ).join( '' ) );
			document.getElementById( 'videos' ).addEventListener( 'click', function ( e ) {
				var b = e.target.closest( '[data-yt]' );
				if ( ! b ) { return; }
				var f = document.createElement( 'iframe' );
				f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent( b.getAttribute( 'data-yt' ) ) + '?autoplay=1';
				f.title = b.getAttribute( 'aria-label' );
				f.allow = 'autoplay; encrypted-media; picture-in-picture';
				f.allowFullscreen = true;
				f.className = 'sc-video sc-video--playing';
				b.replaceWith( f );
			} );
		} );
	};

	pages.contact = function ( s ) {
		var c = s.contact || {};
		fill( '#contact-details',
			'<li>' + icon( 'pin' ) + '<span>' + esc( c.address ).replace( /\n/g, '<br>' ) + '</span></li>' +
			( c.phone ? '<li>' + icon( 'phone' ) + '<span><a href="' + tel( c.phone ) + '">' + esc( c.phone ) + '</a>' + ( c.phoneAlt ? '<br><a href="' + tel( c.phoneAlt ) + '">' + esc( c.phoneAlt ) + '</a>' : '' ) + '</span></li>' : '' ) +
			( c.email ? '<li>' + icon( 'mail' ) + '<span><a href="mailto:' + esc( c.email ) + '">' + esc( c.email ) + '</a></span></li>' : '' ) +
			( s.social && s.social.whatsapp ? '<li>' + icon( 'whatsapp' ) + '<span><a href="' + esc( s.social.whatsapp ) + '" target="_blank" rel="noopener">Follow our WhatsApp channel</a></span></li>' : '' )
		);
		fill( '#contact-social', socialHtml( s, true ) );
		fill( '#contact-actions',
			( c.contactFormUrl ? '<a class="sc-btn sc-btn--green" href="' + esc( c.contactFormUrl ) + '" target="_blank" rel="noopener">Fill in our contact form</a>' : '' ) +
			( c.email ? '<a class="sc-btn ' + ( c.contactFormUrl ? 'sc-btn--outline' : 'sc-btn--green' ) + '" href="mailto:' + esc( c.email ) + '">Email us</a>' : '' ) +
			( c.phone ? '<a class="sc-btn sc-btn--outline" href="' + tel( c.phone ) + '">Call us</a>' : '' ) +
			( s.social && s.social.whatsapp ? '<a class="sc-btn sc-btn--outline" href="' + esc( s.social.whatsapp ) + '" target="_blank" rel="noopener">WhatsApp</a>' : '' )
		);
		if ( c.mapEmbed ) {
			fill( '#contact-map', '<iframe src="' + esc( c.mapEmbed ) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map to our office"></iframe>' ).hidden = false;
		}
	};

	pages.donate = function ( s ) {
		var c = s.contact || {};
		var bank = s.donate && s.donate.bankDetails;
		fill( '#donate-how',
			( bank ? '<p class="sc-bank">' + esc( bank ) + '</p>' : '<p style="color:var(--sc-muted)">Contact us for bank and mobile wallet details. We will confirm your donation and share how it was used.</p>' ) +
			'<div class="sc-btns" style="margin-top:20px;flex-direction:column">' +
			( s.social && s.social.whatsapp ? '<a class="sc-btn sc-btn--green" href="' + esc( s.social.whatsapp ) + '" target="_blank" rel="noopener">Ask on WhatsApp</a>' : '' ) +
			( c.phone ? '<a class="sc-btn sc-btn--outline" href="' + tel( c.phone ) + '">' + esc( c.phone ) + '</a>' : '' ) + '</div>'
		);
		fill( '#donate-volunteer', '<a class="sc-btn sc-btn--outline" href="' + esc( s.links.volunteer ) + '">Volunteer</a>' );
	};

	/* ---------------- lightbox ---------------- */

	var lb = null;
	function initLightbox() {
		var grids = document.querySelectorAll( '[data-sc-lightbox]' );
		if ( ! grids.length ) { return; }
		if ( ! lb ) {
			lb = document.createElement( 'div' );
			lb.className = 'sc-lightbox';
			lb.setAttribute( 'role', 'dialog' );
			lb.setAttribute( 'aria-modal', 'true' );
			lb.setAttribute( 'aria-label', 'Photo viewer' );
			lb.innerHTML = '<img alt=""><button type="button" class="sc-lightbox__close" aria-label="Close">×</button>' +
				'<button type="button" class="sc-lightbox__prev" aria-label="Previous photo">‹</button>' +
				'<button type="button" class="sc-lightbox__next" aria-label="Next photo">›</button><div class="sc-lightbox__count" aria-live="polite"></div>';
			document.body.appendChild( lb );
			var im = lb.querySelector( 'img' );
			var count = lb.querySelector( '.sc-lightbox__count' );
			lb.state = { items: [], i: 0, last: null };
			lb.show = function ( i ) {
				var st = lb.state;
				st.i = ( i + st.items.length ) % st.items.length;
				var a = st.items[ st.i ];
				var t = a.querySelector( 'img' );
				im.src = a.getAttribute( 'href' );
				im.alt = t ? t.getAttribute( 'alt' ) || '' : '';
				count.textContent = ( st.i + 1 ) + ' of ' + st.items.length;
				var multi = st.items.length > 1;
				lb.querySelector( '.sc-lightbox__prev' ).hidden = ! multi;
				lb.querySelector( '.sc-lightbox__next' ).hidden = ! multi;
			};
			lb.close = function () {
				lb.classList.remove( 'is-open' );
				document.body.style.overflow = '';
				im.removeAttribute( 'src' );
				if ( lb.state.last ) { lb.state.last.focus(); }
			};
			lb.querySelector( '.sc-lightbox__close' ).addEventListener( 'click', lb.close );
			lb.querySelector( '.sc-lightbox__prev' ).addEventListener( 'click', function () { lb.show( lb.state.i - 1 ); } );
			lb.querySelector( '.sc-lightbox__next' ).addEventListener( 'click', function () { lb.show( lb.state.i + 1 ); } );
			lb.addEventListener( 'click', function ( e ) { if ( e.target === lb ) { lb.close(); } } );
			document.addEventListener( 'keydown', function ( e ) {
				if ( ! lb.classList.contains( 'is-open' ) ) { return; }
				if ( e.key === 'Escape' ) { lb.close(); }
				if ( e.key === 'ArrowLeft' ) { lb.show( lb.state.i - 1 ); }
				if ( e.key === 'ArrowRight' ) { lb.show( lb.state.i + 1 ); }
			} );
			var sx = null;
			lb.addEventListener( 'touchstart', function ( e ) { sx = e.touches[ 0 ].clientX; }, { passive: true } );
			lb.addEventListener( 'touchend', function ( e ) {
				if ( sx === null ) { return; }
				var dx = e.changedTouches[ 0 ].clientX - sx;
				if ( Math.abs( dx ) > 50 ) { lb.show( lb.state.i + ( dx < 0 ? 1 : -1 ) ); }
				sx = null;
			} );
		}
		Array.prototype.forEach.call( grids, function ( g ) {
			if ( g.hasAttribute( 'data-sc-ready' ) ) { return; }
			g.setAttribute( 'data-sc-ready', '' );
			var links = Array.prototype.slice.call( g.querySelectorAll( '[data-sc-photo]' ) );
			links.forEach( function ( a, i ) {
				a.addEventListener( 'click', function ( e ) {
					e.preventDefault();
					lb.state.items = links;
					lb.state.last = a;
					lb.classList.add( 'is-open' );
					document.body.style.overflow = 'hidden';
					lb.show( i );
					lb.querySelector( '.sc-lightbox__close' ).focus();
				} );
			} );
		} );
	}

	/* ---------------- boot ---------------- */

	load( 'site' ).then( function ( s ) {
		s.links = s.links || {};
		renderHeader( s );
		renderFooter( s );
		// Buttons written into the HTML pages pick up their links from site.json.
		Array.prototype.forEach.call( document.querySelectorAll( '[data-link]' ), function ( a ) {
			var u = s.links[ a.getAttribute( 'data-link' ) ];
			if ( u ) { a.setAttribute( 'href', u ); }
		} );
		if ( pages[ page ] ) { pages[ page ]( s ); }
		initLightbox();
	} ).catch( function ( err ) {
		var msg = window.location.protocol === 'file:' ?
			'This site must be opened through a web server (it cannot load its content when opened as a local file). See HOW-TO-UPDATE.md.' :
			'Some content could not be loaded. Please try again shortly.';
		var main = $( '#sc-main' );
		if ( main ) { main.insertAdjacentHTML( 'afterbegin', '<div class="sc-wrap" style="padding:24px 24px 0"><div class="sc-empty"><p>' + esc( msg ) + '</p></div></div>' ); }
		if ( window.console ) { console.error( err ); }
	} );
} )();
