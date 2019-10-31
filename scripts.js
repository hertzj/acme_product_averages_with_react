const { render } = ReactDOM;
const { Component } = React;
const { HashRouter, Route, Link, Switch, Redirect } = ReactRouterDOM;

const root = document.querySelector('#root');

const Nav = ({ path }) => {
    return (
        <nav>
            <Link to='/' className={ path === '/' ? 'selected' : '' }>Home</Link>
            <Link to='/products' className= { path === '/products' ? 'selected' : '' }>Products</Link>
        </nav>
    )
}

const Home = ({ props, products, avgPrice }) => {
    return (
        <div>
            <h2>Home</h2>
            <p>We have {products.length} products with an average price of { avgPrice } </p>
        </div>
    )
}

const Products = ({ props, products }) => {
    return (
        <div>
            <h2>Products</h2>
            { products.map((product, idx) => {
            return <div className='product'>
                        <ul key={idx} >
                           <li key={idx + 1}><b>Product:</b> { product.name }</li>
                           <li key={idx + 2}><b>Suggested Price:</b> { product.suggestedPrice.toFixed(2) } </li>
                           <li key={idx + 3}><b>Average Price:</b> { product.avgPrice } </li>
                           <li key={idx + 4}><b>Lowest Price:</b> { product.lowPrice } offered by { product.lowComp } </li>
                        </ul>
                   </div>
             }) }
        </div>
    )
}

class App extends Component {
    constructor() {
        super();
        this.state = {
            products: [],
            avgPrice: 0,
            totalAverage: 0,
        }
    }

    componentDidMount() {
        const getProducts = (resolve, reject) => {
            return axios.get(`https://acme-users-api-rev.herokuapp.com/api/products`)
                .then(res => res.data)
        }

        const getCompanies = (resolve, reject) => {
            return axios.get(`https://acme-users-api-rev.herokuapp.com/api/companies`)
                .then(res => res.data)
        }
        

        const getOfferings = (resolve, reject) => {
            return axios.get(`https://acme-users-api-rev.herokuapp.com/api/offerings`)
                .then(res => res.data)
        }

        Promise.all([getCompanies(), getOfferings(), getProducts()])
            .then(response => {
                let [ companies, offerings, products ] = response;

                let totalOffers = 0;  //  if we want the average price of all offers
                let totalPrice = 0; // if we want the average price of all offers
                products.forEach(product => {
                    const offers = offerings.filter(offering => offering.productId === product.id);
                    const sum = offers.reduce((sum, offer) => {
                        let price = offer.price;
                        sum += price;
                        return sum;
                    }, 0)
                    const avgPrice = sum / offers.length;
                    product.avgPrice = avgPrice.toFixed(2);

                    totalOffers += offers.length;
                    totalPrice += sum;

                    let lowPrice = null;
                    let compId = null;
                    offers.forEach(off => {
                        if (off.price < lowPrice || lowPrice === null) {
                            lowPrice = off.price;
                            compId = off.companyId;
                        }
                    })
                    product.lowPrice = lowPrice.toFixed(2);
                    const company = companies.filter(comp => comp.id = compId)[0];
                    product.lowComp = company.name;
                })

                let totalAverage = totalPrice / totalOffers;
                totalAverage = totalAverage.toFixed(2);

                let avgPrice = products.reduce((sum, product) => {
                    let currPrice = product.suggestedPrice;
                    sum += currPrice;
                    return sum;
                }, 0) / products.length;

                avgPrice = avgPrice.toFixed(2)

                this.setState({ avgPrice, products, totalAverage })
                
            })
        
        
    }

    render() {
        const { companies, products, offerings, avgPrice, totalAverage } = this.state

        return (
            <HashRouter>
                <Route render={ ({ location }) => <Nav path = { location.pathname } products={ products } /> }/>
                <Route path='/products' render={ props => <Products { ...props } products={ products } /> } />
                <Route exact path='/' render={ props => <Home { ...props }  products={ products } avgPrice={ avgPrice } /> }  />
            </HashRouter>
        )
    }
}

render(<App />, root);