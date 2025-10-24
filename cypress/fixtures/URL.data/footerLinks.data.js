export const footerMenuLinks = [
    
    
    {
        selector: '#footerPanel ul li a[href*="index.htm"]', //* means partial match 
        label: 'Home',
        destination: '/parabank/index.htm',
        linkStatus: 'internal',
        path: '/index.htm',
        newTab: false, 
        expectedTitle: 'ParaBank | Welcome | Online Banking',
        expectedHeading: 'Latest News' //<h4>
    },

    {
        selector: '#footerPanel ul li a[href*="about.htm"]',
        label: 'About Us',
        destination: '/parabank/about.htm',
        linkStatus: 'internal',
        path: '/about.htm',
        newTab: false, 
        expectedTitle: 'ParaBank | About Us',
        expectedHeading: 'ParaSoft Demo Website' 
    },

    {
        selector: '#footerPanel ul li a[href*="services.htm"]',
        label:'Services',
        destination: '/parabank/services.htm',
        linkStatus: 'internal',
        path: '/services.htm',
        newTab: false,
        expectedTitle: 'ParaBank | Services',
        expectedHeading: 'Available Bookstore SOAP services'
    },

     {
        selector:'#footerPanel ul li a[href*="products.jsp"]', 
        label: 'Products',
        destination:'http://www.parasoft.com/products',
        linkStatus: 'external',
        newTab: false
    
    },

     {
        selector:'#footerPanel ul li a[href*="contacts.jsp"]',
        label: 'Locations',
        destination: 'http://www.parasoft.com/solutions/',
        linkStatus: 'external',
        newTab: false
    },

    {
        selector: '#footerPanel ul li a[href="http://forums.parasoft.com/"]',
        label: 'Forum',
        destination: 'https://forums.parasoft.com/',
        linkStatus: 'external',
        newTab: false, 
    },

    {
        selector: '#footerPanel ul li a[href*="sitemap.htm"]',
        label:'Site Map',
        destination: '/parabank/sitemap.htm',
        linkStatus: 'internal',
        path: '/sitemap.htm',
        newTab: false,
        expectedTitle: 'ParaBank | Site Map',
    },

    {
        selector: '#footerPanel ul li a[href*="contact.htm"]',
        label:'Contact Us',
        destination: '/parabank/contact.htm',
        linkStatus: 'internal',
        path: '/contact.htm',
        newTab: false,
        expectedTitle: 'ParaBank | Customer Care',
        expectedHeading: 'Customer Care'
    },

      {
        selector: '#footerPanel .visit a',
        label:'www.parasoft.com',
        destination: 'http://www.parasoft.com',
        linkStatus: 'external',
        newTab: true,
    },

]

