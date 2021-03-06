module.exports = {
  siteMetadata: {
    title: `Emilio Ziniades Portfolio Website`,
    description: `Emilio Ziniades: teaches, writes, codes`,
    author: `emilioziniades@gmail.com`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    `react-spacer`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      }
    },
      {
        resolve: `gatsby-source-filesystem`,
        options: {
          name: `content`,
          path: `${__dirname}/src/content`,
        },
    },
    'gatsby-transformer-remark',
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/favicon.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-styled-components`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
