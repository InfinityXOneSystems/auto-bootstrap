# Example OPA policy (governance baseline)
package infinityx.authz
default allow = false
allow {
    input.user == "admin"
}
