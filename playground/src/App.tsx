import "./index.css";

import { useSyncExternalStore } from "react";
import { EaseNav } from "@easenav/core";
import { Routes, Route, Link } from "react-router-dom";
import { EaseNavButton } from "./ease-nav-button";

const Home = () => <h1>Home Page</h1>;
const About = () => <h1>About Page</h1>;
const Users = () => <h1>Users Page</h1>;
const ActiveUsersList = () => (
	<div>
		<h1>Active Users List</h1>
		<Link to="/users">Back to Users</Link>
	</div>
);
const InactiveUsersList = () => (
	<div>
		<h1>Inactive Users List</h1>
		<Link to="/users">Back to Users</Link>
	</div>
);
const NotFound = () => <h1>Not Found</h1>;

const easeNav = new EaseNav()
	.register({ path: "/", component: Home })
	.register({ path: "/users", component: Users })
	.register({ path: "/users/active", component: ActiveUsersList })
	.register({ path: "/users/inactive", component: InactiveUsersList })
	.register({ path: "/about", component: About })
	.register({ path: "*", component: NotFound });

function useVisibleEntries() {
	return useSyncExternalStore(easeNav.subscribe, easeNav.getEntries);
}

function Header() {
	const tree = useSyncExternalStore(easeNav.subscribe, easeNav.getTree);
	return (
		<header className="nav-header">
			<h2>EaseNav Playground</h2>
			<nav className="nav-bar">
				{tree.map(({ entry, children }) =>
					children.length > 0 ? (
						<div key={entry.path} className="nav-dropdown">
							<Link to={entry.path} className="nav-link">{entry.title}</Link>
							<div className="nav-dropdown-menu">
								{children.map(child => (
									<Link key={child.path} to={child.path} className="nav-dropdown-item">
										{child.title}
									</Link>
								))}
							</div>
						</div>
					) : (
						<Link key={entry.path} to={entry.path} className="nav-link">{entry.title}</Link>
					)
				)}
			</nav>
		</header>
	);
}

function AppRoutes() {
	const entries = useVisibleEntries();
	return (
		<Routes>
			{entries.map(entry => (
				<Route key={entry.path} path={entry.path} Component={entry.component as React.ComponentType} />
			))}
			<Route path="*" Component={NotFound} />
		</Routes>
	);
}

export function App() {
	return (
		<div className="app">
			<Header />
			<AppRoutes />
			<EaseNavButton easeNav={easeNav} />
		</div>
	);
}

export default App;
