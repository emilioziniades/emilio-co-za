import React from "react"

import Layout from "../components/layout"
import Hero from "../components/hero"

export default function IndexPage() {
  return (
    <Layout pageTitle={false}>
      <Hero />
    </Layout>
  )
}
