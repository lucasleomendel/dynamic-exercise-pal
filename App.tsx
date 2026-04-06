// Importing the LoadingScreen component
import LoadingScreen from './path/to/LoadingScreen';

// ProtectedRoute component update
const ProtectedRoute = ({ component: Component, ...rest }) => {
    return (
        <Route
            {...rest}
            render={(props) => (
                isAuthenticated() ? (
                    <Component {...props} />
                ) : (
                    <LoadingScreen />
                )
            )}
        />
    );
};

// AuthRoute component update
const AuthRoute = ({ component: Component, ...rest }) => {
    return (
        <Route
            {...rest}
            render={(props) => ( 
                isAuthenticated() ? (
                    <LoadingScreen />
                ) : (
                    <Component {...props} />
                )
            )}
        />
    );
};

// Adding the CREFValidation route
<Route path="/cref-validation" component={CREFValidation} />

// Adding the PersonalRoute with cref_status verification
const PersonalRoute = ({ component: Component, ...rest }) => {
    return (
        <Route
            {...rest}
            render={(props) => (
                cref_status ? (
                    <Component {...props} />
                ) : (
                    <Redirect to="/not-authorized" />
                )
            )}
        />
    );
};

export { ProtectedRoute, AuthRoute, PersonalRoute };