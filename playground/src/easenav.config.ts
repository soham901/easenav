import { EaseNav } from "@easenav/core"

const easeNav = new EaseNav()

easeNav
	.register({ path: "/", component: Home })
	.register({ path: "/users", component: Users })
	// .register({ path: "/users/active", component: ActiveUsersList })
	// .register({ path: "/users/inactive", component: InactiveUsersList })
	.register({ path: "/about", component: About })
