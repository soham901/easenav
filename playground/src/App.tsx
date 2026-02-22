import "./index.css";

import { useSyncExternalStore } from "react";
import { EaseNav } from "@easenav/core";

import { Routes, Route, Link } from 'react-router-dom';
import { EaseNavButton } from "./ease-nav-button";

const Home = () => <h1>Home Page</h1>;
const About = () => <h1>About Page</h1>;
const Users = () => <div>
	<h1>Users Page</h1>
	<Link to="/users/active">Active Users</Link>
	<Link to="/users/inactive">Inactive Users</Link>
</div>
const ActiveUsersList = () => <div>
	<h1>Active Users List</h1>
	<Link to="/users">Back to Users</Link>
</div>
const InactiveUsersList = () => <div>
	<h1>Inactive Users List</h1>
	<Link to="/users">Back to Users</Link>
</div>
const NotFound = () => <h1>Not Found</h1>;

const easeNav = new EaseNav()
	.register({ path: "/", component: Home })
	.register({ path: "/users", component: Users })
	.register({ path: "/about", component: About });

function useEaseNavEntries() {
	return useSyncExternalStore(easeNav.subscribe, easeNav.getEntries);
}

const Header = () => {
	const entries = useEaseNavEntries();
	return <div style={{display: "flex", justifyContent: "space-around", alignItems: "center", gap: "8rem"}}>
		<h2 className="">Example App</h2>
		<div style={{display: "flex", gap: ".8rem"}}>
			{entries.map(entry => <Link key={entry.path} to={entry.path}>{entry.title}</Link>)}
		</div>
	</div>
}

const MyRoutes = () => {
	const entries = useEaseNavEntries();
	return (
		<Routes>
			{entries.map(entry => <Route key={entry.path} path={entry.path} Component={entry.component} />)}
			<Route path="*" Component={NotFound} />
		</Routes>
	)
}

export function App() {
	return (
		<div className="app">
			<Header />
			<MyRoutes />
			<EaseNavButton easeNav={easeNav} />
		</div>
	);
}

export default App;
