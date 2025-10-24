export const mainMenuPages =[

    {
        selector: 'ul.leftmenu a[href*="about.htm"]',
        label: 'About Us',
        destination: '/parabank/about.htm',
        linkStatus: 'internal',
        path: '/about.htm',
        newTab: false, 
        expectedTitle: 'ParaBank | About Us',
        expectedHeading: 'ParaSoft Demo Website' 
    },

    {
        selector: 'ul.leftmenu a[href*="services.htm"]',
        label:'Services',
        destination: '/parabank/services.htm',
        linkStatus: 'internal',
        path: '/services.htm',
        newTab: false,
        expectedTitle: 'ParaBank | Services',
        expectedHeading: 'Available Bookstore SOAP services'
    },

    {
        selector:'ul.leftmenu a[href*="products.jsp"]', 
        label: 'Products',
        destination:'https://www.parasoft.com/products',
        linkStatus: 'external',
        newTab: false
    
    },

    {
        selector:'ul.leftmenu a[href*="contacts.jsp"]',
        label: 'Locations',
        destination: 'https://www.parasoft.com/solutions/',
        linkStatus: 'external',
        newTab: false
    },

        {
        selector:'ul.leftmenu a[href*="admin.htm"]', 
        label: 'Admin Page',
        destination: '/parabank/admin.htm',
        linkStatus: 'internal',
        path: '/admin.htm',
        newTab: false,
        expectedTitle: 'ParaBank | Administration',
        expectedHeading: 'Administration'
    },

]