/**
 * Auth state management using Svelte 5 Runes.
 */
class AuthState {
	user = $state<any>(null);
	isAuthenticated = $derived(this.user !== null);

	login(userData: any) {
		this.user = userData;
	}

	logout() {
		this.user = null;
	}
}

export const auth = new AuthState();
