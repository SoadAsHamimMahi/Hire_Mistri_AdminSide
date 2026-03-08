import axios from 'axios'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useApi() {
  const { getIdToken } = useContext(AuthContext)

  const request = async (config) => {
    const token = await getIdToken()
    return axios({
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  const get = (url, params) => request({ method: 'get', url, params })
  const post = (url, data) => request({ method: 'post', url, data })
  const patch = (url, data) => request({ method: 'patch', url, data })
  const del = (url) => request({ method: 'delete', url })

  return { request, get, post, patch, delete: del }
}
