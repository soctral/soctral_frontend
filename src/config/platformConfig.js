/**
 * Platform Configuration for Unified Account Upload Forms
 * 
 * Each platform defines:
 * - filters: Fields for account identification/searching
 * - metrics: Performance and insight data
 * - accountTypes: Optional sub-variants (e.g., Instagram Business vs Business+FB)
 */

// =========================================
// Shared Dropdown Options
// =========================================

export const COUNTRIES = [
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'IN', label: 'India' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'BR', label: 'Brazil' },
    { value: 'MX', label: 'Mexico' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'PL', label: 'Poland' },
    { value: 'RU', label: 'Russia' },
    { value: 'JP', label: 'Japan' },
    { value: 'KR', label: 'South Korea' },
    { value: 'CN', label: 'China' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'AE', label: 'UAE' },
    { value: 'OTHER', label: 'Other' },
];

export const NICHES = [
    { value: 'business_finance', label: 'Business & Finance' },
    { value: 'technology', label: 'Technology' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' },
    { value: 'news_media', label: 'News & Media' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'education', label: 'Education' },
    { value: 'health_wellness', label: 'Health & Wellness' },
    { value: 'fashion_beauty', label: 'Fashion & Beauty' },
    { value: 'food_cooking', label: 'Food & Cooking' },
    { value: 'travel', label: 'Travel' },
    { value: 'art_design', label: 'Art & Design' },
    { value: 'music', label: 'Music' },
    { value: 'photography', label: 'Photography' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'parenting', label: 'Parenting' },
    { value: 'politics', label: 'Politics' },
    { value: 'science', label: 'Science' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'pets', label: 'Pets' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'diy_crafts', label: 'DIY & Crafts' },
    { value: 'crypto', label: 'Crypto & Web3' },
    { value: 'other', label: 'Other' },
];

export const GENDERS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

// =========================================
// Field Type Constants
// =========================================
export const FIELD_TYPES = {
    TEXT: 'text',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    SELECT: 'select',
    DATE: 'date',
};

// =========================================
// Platform Configurations
// =========================================

export const PLATFORM_CONFIGS = {
    // -----------------------------------------
    // FACEBOOK
    // -----------------------------------------
    facebook: {
        id: 'facebook',
        label: 'Facebook',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'recent_posts', label: 'Recent Posts', sublabel: 'Number of Recent Posts', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'recent_posts' },
            { key: 'follower_demographics', label: 'Follower Demographics', sublabel: 'Top Country', type: FIELD_TYPES.SELECT, required: true, options: COUNTRIES, apiKey: 'follower_demographics' },
            { key: 'monetised', label: 'Monetised Account', sublabel: 'Is this account monetised?', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'is_monetised' },
            { key: 'ad_performance', label: 'Ad Performance', sublabel: 'Average Ad Engagement Rate (%)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'ad_performance', step: 0.01 },
        ],
    },

    // -----------------------------------------
    // INSTAGRAM
    // -----------------------------------------
    instagram: {
        id: 'instagram',
        label: 'Instagram',
        accountTypes: [
            { value: 'business', label: 'IG Business' },
            { value: 'business_with_fb', label: 'IG Business with FB Page' },
        ],
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'niche', label: 'Content Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
        ],
        metrics: [
            { key: 'follower_demographics', label: 'Follower Demographics', sublabel: 'Top Country', type: FIELD_TYPES.SELECT, required: true, options: COUNTRIES, apiKey: 'top_country' },
            { key: 'engagement_rate', label: 'Engagement Rate', sublabel: 'Average Engagement Rate (%)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'engagement_rate', step: 0.01 },
            { key: 'monetised', label: 'Monetised Account', sublabel: 'Is this account monetised?', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'is_monetised' },
            // Conditional fields for business_with_fb account type
            { key: 'media_insights', label: 'Media Insights', sublabel: 'Average Post Reach', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'average_post_reach', accountType: 'business_with_fb' },
            { key: 'story_views', label: 'Story Views', sublabel: 'Average Story Views', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'average_story_views', accountType: 'business_with_fb' },
            { key: 'reels_performance', label: 'IGTV/Reels Performance', sublabel: 'Average Reels Views', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'average_reels_views', accountType: 'business_with_fb' },
        ],
    },

    // -----------------------------------------
    // TWITTER (X)
    // -----------------------------------------
    twitter: {
        id: 'twitter',
        label: 'Twitter (X)',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            {
                key: 'subscription_type',
                label: 'Subscription Type',
                sublabel: 'Account subscription level',
                type: FIELD_TYPES.SELECT,
                required: true,
                options: [
                    { value: 'basic', label: 'Basic (Free)' },
                    { value: 'premium', label: 'Premium' },
                    { value: 'premium_plus', label: 'Premium+' },
                ],
                apiKey: 'subscription_type'
            },
            { key: 'total_posts', label: 'Total Posts', sublabel: 'Number of Tweets', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'total_posts' },
            { key: 'impressions', label: 'Impressions', sublabel: 'Average Monthly Impressions', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'impressions' },
        ],
    },

    // -----------------------------------------
    // TIKTOK
    // -----------------------------------------
    tiktok: {
        id: 'tiktok',
        label: 'TikTok',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'likes', label: 'Total Likes', sublabel: 'Total number of likes received', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'likes' },
            { key: 'engagements', label: 'Engagements', sublabel: 'Total engagement count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'engagements' },
            { key: 'post_count', label: 'Number of Posts', sublabel: 'Total videos posted', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'post_count' },
        ],
    },

    // -----------------------------------------
    // LINKEDIN
    // -----------------------------------------
    linkedin: {
        id: 'linkedin',
        label: 'LinkedIn',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'connection_count', label: 'Connection Count', sublabel: 'Number of Connections', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'connection_count' },
            { key: 'experience', label: 'Experience', sublabel: 'Professional experience description', type: FIELD_TYPES.TEXT, required: true, apiKey: 'experience' },
        ],
    },

    // -----------------------------------------
    // YOUTUBE
    // -----------------------------------------
    youtube: {
        id: 'youtube',
        label: 'YouTube',
        filters: [
            { key: 'channel_username', label: 'Channel Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'channel_username' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'subscribers', label: 'Subscribers', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'subscribers' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
        ],
        metrics: [
            { key: 'video_count', label: 'Video Count', sublabel: 'Total number of uploaded videos', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'video_count' },
            { key: 'engagements', label: 'Engagements', sublabel: 'Average video engagement', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'engagements' },
            { key: 'channel_views', label: 'Channel View Count', sublabel: 'Total lifetime views', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'channel_views' },
        ],
    },

    // -----------------------------------------
    // SNAPCHAT
    // -----------------------------------------
    snapchat: {
        id: 'snapchat',
        label: 'Snapchat',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'public_story_views', label: 'Public Stories (28 days)', sublabel: 'Number of snap views', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'public_story_views_28d' },
            { key: 'public_story_viewers', label: 'Story Viewers (28 days)', sublabel: 'Number of snap viewers', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'public_story_viewers_28d' },
            { key: 'spotlight_views', label: 'Spotlight Views (28 days)', sublabel: 'Spotlight performance', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'spotlight_views_28d' },
            { key: 'profile_views', label: 'Profile Views (28 days)', sublabel: 'Profile visit count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'profile_views_28d' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
        ],
    },

    // -----------------------------------------
    // PINTEREST
    // -----------------------------------------
    pinterest: {
        id: 'pinterest',
        label: 'Pinterest',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'followers_count', label: 'Number of Followers', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'pin_count', label: 'Number of Pins', sublabel: 'Total pins created', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'pin_count' },
            { key: 'board_count', label: 'Number of Boards', sublabel: 'Total boards', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'board_count' },
        ],
    },

    // -----------------------------------------
    // REDDIT
    // -----------------------------------------
    reddit: {
        id: 'reddit',
        label: 'Reddit',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
        ],
        metrics: [
            { key: 'post_karma', label: 'Post Karma Score', sublabel: 'Total post karma (important)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'post_karma' },
            { key: 'comment_karma', label: 'Comment Karma Score', sublabel: 'Total comment karma (important)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'comment_karma' },
            { key: 'subscriber_count', label: 'Subscriber Count', sublabel: 'Profile subscribers', type: FIELD_TYPES.NUMBER, required: false, apiKey: 'subscriber_count' },
            { key: 'subreddit_community', label: 'Subreddit Community', sublabel: 'Owns a subreddit community?', type: FIELD_TYPES.BOOLEAN, required: false, apiKey: 'subreddit_community' },
        ],
    },

    // -----------------------------------------
    // TWITCH
    // -----------------------------------------
    twitch: {
        id: 'twitch',
        label: 'Twitch',
        filters: [
            { key: 'channel_username', label: 'Channel Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'channel_username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
        ],
        metrics: [
            { key: 'video_data', label: 'Video Data', sublabel: 'Video statistics (optional)', type: FIELD_TYPES.TEXT, required: false, apiKey: 'video_data' },
        ],
    },

    // -----------------------------------------
    // RUMBLE
    // -----------------------------------------
    rumble: {
        id: 'rumble',
        label: 'Rumble',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
        ],
        metrics: [
            { key: 'video_count', label: 'Video Count', sublabel: 'Total videos uploaded', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'video_count' },
            { key: 'other_metrics', label: 'Other Metrics', sublabel: 'Additional information', type: FIELD_TYPES.TEXT, required: false, apiKey: 'other_metrics' },
        ],
    },

    // -----------------------------------------
    // WECHAT
    // -----------------------------------------
    wechat: {
        id: 'wechat',
        label: 'WeChat Business',
        filters: [
            { key: 'account_username', label: 'Account Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'account_username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            {
                key: 'account_type',
                label: 'Account Type',
                sublabel: 'Type of WeChat account',
                type: FIELD_TYPES.SELECT,
                required: true,
                options: [
                    { value: 'subscription', label: 'Subscription Account' },
                    { value: 'service', label: 'Service Account' },
                ],
                apiKey: 'account_type'
            },
            { key: 'follower_count', label: 'Follower Count', sublabel: 'Number of followers', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'follower_count' },
        ],
    },

    // -----------------------------------------
    // TELEGRAM
    // -----------------------------------------
    telegram: {
        id: 'telegram',
        label: 'Telegram',
        filters: [
            { key: 'channel_username', label: 'Channel Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'channel_username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'verified', label: 'Verified', sublabel: 'Is the channel verified?', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'verified' },
            { key: 'member_count', label: 'Number of Members', sublabel: 'Members in group/channel', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'member_count' },
        ],
    },

    // -----------------------------------------
    // DISCORD
    // -----------------------------------------
    discord: {
        id: 'discord',
        label: 'Discord',
        filters: [
            { key: 'channel_username', label: 'Server/Channel Name', type: FIELD_TYPES.TEXT, required: true, apiKey: 'channel_username' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'server_niche', label: 'Server Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'server_niche' },
        ],
        metrics: [
            { key: 'member_count', label: 'Number of Members', sublabel: 'Total server members', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'member_count' },
            {
                key: 'community_type',
                label: 'Community Type',
                sublabel: 'Type of community',
                type: FIELD_TYPES.SELECT,
                required: true,
                options: [
                    { value: 'gaming', label: 'Gaming' },
                    { value: 'education', label: 'Education' },
                    { value: 'crypto', label: 'Crypto/NFT' },
                    { value: 'music', label: 'Music' },
                    { value: 'tech', label: 'Technology' },
                    { value: 'social', label: 'Social' },
                    { value: 'other', label: 'Other' },
                ],
                apiKey: 'community_type'
            },
            { key: 'phone_access', label: 'Phone Number Access', sublabel: 'Has phone verification?', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'phone_access' },
        ],
    },

    // -----------------------------------------
    // FLICKR
    // -----------------------------------------
    flickr: {
        id: 'flickr',
        label: 'Flickr',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            {
                key: 'account_type',
                label: 'Account Type',
                type: FIELD_TYPES.SELECT,
                required: true,
                options: [
                    { value: 'free', label: 'Free' },
                    { value: 'pro', label: 'Pro' },
                ],
                apiKey: 'account_type'
            },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'follower_count', label: 'Follower Count', sublabel: 'Number of followers', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'follower_count' },
            { key: 'public_photos', label: 'Public Photos', sublabel: 'Number of public photos', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'public_photos' },
        ],
    },

    // -----------------------------------------
    // STEAM
    // -----------------------------------------
    steam: {
        id: 'steam',
        label: 'Steam',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'games_owned', label: 'No. of Games Owned', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'games_owned' },
        ],
        metrics: [
            { key: 'total_playtime', label: 'Total Playtime', sublabel: 'Total hours played', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'total_playtime' },
            { key: 'inventory_items', label: 'Inventory Items', sublabel: 'Number of inventory items', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'inventory_items' },
        ],
    },

    // -----------------------------------------
    // VIMEO
    // -----------------------------------------
    vimeo: {
        id: 'vimeo',
        label: 'Vimeo',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            {
                key: 'account_type',
                label: 'Account Type',
                sublabel: 'Vimeo subscription level',
                type: FIELD_TYPES.SELECT,
                required: true,
                options: [
                    { value: 'basic', label: 'Basic' },
                    { value: 'plus', label: 'Plus' },
                    { value: 'pro', label: 'Pro' },
                    { value: 'business', label: 'Business' },
                    { value: 'premium', label: 'Premium' },
                    { value: 'enterprise', label: 'Enterprise' },
                ],
                apiKey: 'account_type'
            },
            { key: 'video_count', label: 'Video Count', sublabel: 'Total videos uploaded', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'video_count' },
            { key: 'view_count', label: 'View Count', sublabel: 'Total video views', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'view_count' },
        ],
    },

    // -----------------------------------------
    // ONLYFANS
    // -----------------------------------------
    onlyfans: {
        id: 'onlyfans',
        label: 'OnlyFans',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'gender', label: 'Gender', type: FIELD_TYPES.SELECT, required: true, options: GENDERS, apiKey: 'gender' },
            { key: 'subscriber_count', label: 'Subscriber Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'subscriber_count' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'subscriber_demographics', label: 'Subscriber Demographics', sublabel: 'Top subscriber location', type: FIELD_TYPES.SELECT, required: true, options: COUNTRIES, apiKey: 'subscriber_demographics' },
            { key: 'view_count', label: 'View Count', sublabel: 'Total content views', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'view_count' },
        ],
    },

    // -----------------------------------------
    // TINDER
    // -----------------------------------------
    tinder: {
        id: 'tinder',
        label: 'Tinder',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'owner_age', label: 'Age of Account Owner', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'owner_age' },
        ],
        metrics: [
            { key: 'verified_badge', label: 'Verified Badge', sublabel: 'Has verified badge?', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'verified_badge' },
        ],
    },

    // -----------------------------------------
    // QUORA
    // -----------------------------------------
    quora: {
        id: 'quora',
        label: 'Quora',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'followers_count', label: 'Follower Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
        ],
        metrics: [
            { key: 'view_count', label: 'View Count', sublabel: 'Total content views (optional)', type: FIELD_TYPES.NUMBER, required: false, apiKey: 'view_count' },
            { key: 'niche', label: 'Niche', sublabel: 'Content niche (optional)', type: FIELD_TYPES.SELECT, required: false, options: NICHES, apiKey: 'niche' },
        ],
    },

    // -----------------------------------------
    // LEGACY PLATFORMS (from existing code)
    // -----------------------------------------
    mewe: {
        id: 'mewe',
        label: 'MeWe',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'post_count', label: 'Post Count', sublabel: 'Total posts', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'post_count' },
            { key: 'engagement', label: 'Engagement', sublabel: 'Average engagement', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'engagement' },
        ],
    },

    qzone: {
        id: 'qzone',
        label: 'QZone',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'post_count', label: 'Post Count', sublabel: 'Total posts', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'post_count' },
            { key: 'visitors', label: 'Visitors', sublabel: 'Total visitors', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'visitors' },
        ],
    },

    tumblr: {
        id: 'tumblr',
        label: 'Tumblr',
        filters: [
            { key: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, apiKey: 'username' },
            { key: 'followers_count', label: 'Followers Count', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'followers_count' },
            { key: 'original_email', label: 'Original Email Available', type: FIELD_TYPES.BOOLEAN, required: true, apiKey: 'original_email' },
            { key: 'niche', label: 'Niche', type: FIELD_TYPES.SELECT, required: true, options: NICHES, apiKey: 'niche' },
            { key: 'age', label: 'Account Age (Years)', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'account_age_years', step: 0.1 },
        ],
        metrics: [
            { key: 'post_count', label: 'Post Count', sublabel: 'Total posts', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'post_count' },
            { key: 'notes_count', label: 'Notes Count', sublabel: 'Total notes received', type: FIELD_TYPES.NUMBER, required: true, apiKey: 'notes_count' },
        ],
    },
};

// =========================================
// Helper Functions
// =========================================

/**
 * Get platform configuration by ID
 * @param {string} platformId - Platform identifier (e.g., 'facebook', 'instagram')
 * @returns {Object|null} Platform configuration or null if not found
 */
export const getPlatformConfig = (platformId) => {
    if (!platformId) return null;
    return PLATFORM_CONFIGS[platformId.toLowerCase()] || null;
};

/**
 * Get all supported platform IDs
 * @returns {string[]} Array of platform IDs
 */
export const getSupportedPlatforms = () => {
    return Object.keys(PLATFORM_CONFIGS);
};

/**
 * Get fields for a form type (filters or metrics)
 * @param {string} platformId - Platform identifier
 * @param {string} formType - 'filters' or 'metrics'
 * @param {string} accountType - Optional account type for conditional fields
 * @returns {Array} Array of field configurations
 */
export const getFormFields = (platformId, formType, accountType = null) => {
    const config = getPlatformConfig(platformId);
    if (!config) return [];

    const fields = config[formType] || [];

    // Filter fields based on account type if applicable
    return fields.filter(field => {
        if (!field.accountType) return true; // Field applies to all account types
        return field.accountType === accountType;
    });
};

/**
 * Get initial form state for a platform
 * @param {string} platformId - Platform identifier
 * @param {string} formType - 'filters' or 'metrics'
 * @returns {Object} Initial form state object
 */
export const getInitialFormState = (platformId, formType) => {
    const fields = getFormFields(platformId, formType);
    const state = {};

    fields.forEach(field => {
        state[field.key] = '';
    });

    return state;
};

/**
 * Transform form data to API format (array of {key, value, type})
 * @param {Object} formData - Form data object
 * @param {Array} fieldConfigs - Field configuration array
 * @returns {Array} Array of metric/filter objects for API
 */
export const transformToApiFormat = (formData, fieldConfigs) => {
    const result = [];

    fieldConfigs.forEach(field => {
        const value = formData[field.key];

        // Skip empty values
        if (value === '' || value === undefined || value === null) return;

        let transformedValue = value;
        let valueType = 'string';

        switch (field.type) {
            case FIELD_TYPES.NUMBER:
                transformedValue = parseFloat(value);
                valueType = 'number';
                break;
            case FIELD_TYPES.BOOLEAN:
                transformedValue = value === 'yes' || value === true;
                valueType = 'boolean';
                break;
            default:
                transformedValue = String(value);
                valueType = 'string';
        }

        result.push({
            key: field.apiKey || field.key,
            value: transformedValue,
            type: valueType,
        });
    });

    return result;
};

/**
 * Validate form data against field requirements
 * @param {Object} formData - Form data object
 * @param {Array} fieldConfigs - Field configuration array
 * @returns {Object} { isValid: boolean, errors: { [fieldKey]: string } }
 */
export const validateFormData = (formData, fieldConfigs) => {
    const errors = {};

    fieldConfigs.forEach(field => {
        if (!field.required) return;

        const value = formData[field.key];

        if (value === '' || value === undefined || value === null) {
            errors[field.key] = `${field.label} is required`;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export default PLATFORM_CONFIGS;
