/**
 * External dependencies
 */
import { get, isUndefined, pickBy } from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Placeholder,
	QueryControls,
	RangeControl,
	Spinner,
	ToggleControl,
	Toolbar,
	withAPIData,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import InspectorControls from '../../inspector-controls';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const MAX_POSTS_COLUMNS = 6;

class LatestPostsBlock extends Component {
	constructor() {
		super( ...arguments );

		this.toggleDisplayPostDate = this.toggleDisplayPostDate.bind( this );
	}

	toggleDisplayPostDate() {
		const { displayPostDate } = this.props.attributes;
		const { setAttributes } = this.props;

		setAttributes( { displayPostDate: ! displayPostDate } );
	}

	render() {
		const latestPosts = this.props.latestPosts.data;
		const { attributes, categoriesList, isSelected, setAttributes } = this.props;
		const { displayPostDate, align, layout, columns, order, orderBy, categories, postsToShow } = attributes;

		const inspectorControls = isSelected && (
			<InspectorControls key="inspector">
				<h3>{ __( 'Latest Posts Settings' ) }</h3>
				<QueryControls
					{ ...{ order, orderBy } }
					numberOfItems={ postsToShow }
					categoriesList={ get( categoriesList, 'data', {} ) }
					selectedCategoryId={ categories }
					onOrderChange={ ( value ) => setAttributes( { order: value } ) }
					onOrderByChange={ ( value ) => setAttributes( { orderBy: value } ) }
					onCategoryChange={ ( value ) => setAttributes( { categories: '' !== value ? value : undefined } ) }
					onNumberOfItemsChange={ ( value ) => setAttributes( { postsToShow: value } ) }
				/>
				<ToggleControl
					label={ __( 'Display post date' ) }
					checked={ displayPostDate }
					onChange={ this.toggleDisplayPostDate }
				/>
				{ layout === 'grid' &&
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ ( value ) => setAttributes( { columns: value } ) }
						min={ 2 }
						max={ ! hasPosts ? MAX_POSTS_COLUMNS : Math.min( MAX_POSTS_COLUMNS, latestPosts.length ) }
					/>
				}
			</InspectorControls>
		);

		const hasPosts = Array.isArray( latestPosts ) && latestPosts.length;
		if ( ! hasPosts ) {
			return [
				inspectorControls,
				<Placeholder key="placeholder"
					icon="admin-post"
					label={ __( 'Latest Posts' ) }
				>
					{ ! Array.isArray( latestPosts ) ?
						<Spinner /> :
						__( 'No posts found.' )
					}
				</Placeholder>,
			];
		}

		// Removing posts from display should be instant.
		const displayPosts = latestPosts.length > postsToShow ?
			latestPosts.slice( 0, postsToShow ) :
			latestPosts;

		const layoutControls = [
			{
				icon: 'list-view',
				title: __( 'List View' ),
				onClick: () => setAttributes( { layout: 'list' } ),
				isActive: layout === 'list',
			},
			{
				icon: 'grid-view',
				title: __( 'Grid View' ),
				onClick: () => setAttributes( { layout: 'grid' } ),
				isActive: layout === 'grid',
			},
		];

		return [
			inspectorControls,
			isSelected && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
					<Toolbar controls={ layoutControls } />
				</BlockControls>
			),
			<ul
				className={ classnames( this.props.className, {
					'is-grid': layout === 'grid',
					[ `columns-${ columns }` ]: layout === 'grid',
				} ) }
				key="latest-posts"
			>
				{ displayPosts.map( ( post, i ) =>
					<li key={ i }>
						<a href={ post.link } target="_blank">{ decodeEntities( post.title.rendered.trim() ) || __( '(Untitled)' ) }</a>
						{ displayPostDate && post.date_gmt &&
							<time dateTime={ moment( post.date_gmt ).utc().format() } className={ `${ this.props.className }__post-date` }>
								{ moment( post.date_gmt ).local().format( 'MMMM DD, Y' ) }
							</time>
						}
					</li>
				) }
			</ul>,
		];
	}
}

export default withAPIData( ( props ) => {
	const { postsToShow, order, orderBy, categories } = props.attributes;
	const latestPostsQuery = stringify( pickBy( {
		categories,
		order,
		orderBy,
		per_page: postsToShow,
		_fields: [ 'date_gmt', 'link', 'title' ],
	}, value => ! isUndefined( value ) ) );
	const categoriesListQuery = stringify( {
		per_page: 100,
		_fields: [ 'id', 'name', 'parent' ],
	} );
	return {
		latestPosts: `/wp/v2/posts?${ latestPostsQuery }`,
		categoriesList: `/wp/v2/categories?${ categoriesListQuery }`,
	};
} )( LatestPostsBlock );
