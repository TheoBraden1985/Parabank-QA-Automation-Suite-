export const topNavLinks = [

{
        selector: '.button a[href*="index.htm"]',
        label:'home',
        destination: '/parabank/index.htm',
        linkStatus: 'internal',
        path: '/index.htm',
        newTab: false,
        expectedTitle: 'ParaBank | Welcome | Online Banking',
        expectedHeading: 'Latest News'

},

{
        selector: '.button a[href*="about.htm"]',
        label: 'about',
        destination: '/parabank/about.htm',
        linkStatus: 'internal',
        path: '/about.htm',
        newTab: false, 
        expectedTitle: 'ParaBank | About Us',
        expectedHeading: 'ParaSoft Demo Website' 
},

{
        selector: '.button a[href*="contact.htm"]',
        label: 'contact',
        destination: '/parabank/contact.htm',
        linkStatus: 'internal',
        path: '/contact.htm',
        newTab: false,
        expectedTitle: 'ParaBank | Customer Care',
        expectedHeading: 'Customer Care'
},



]