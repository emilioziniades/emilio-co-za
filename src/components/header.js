import React from "react"
import { Link } from "gatsby"
import { Helmet } from 'react-helmet'
import styled from "styled-components"

const StyledHeader = styled.header`
  width: 100%;
  max-width: 62.5rem;
  height: 6.25rem;
  margin: 0 auto;
  padding: 0 2.5rem;
  background: inherit;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const StyledLogo = styled.div`
  font-size: 2rem;
  font-weight: 900;
  color: black;
`

const Header = () => {
  return (
    <StyledHeader>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Emilio Ziniades</title>
          <link rel="canonical" href="https://emilio.co.za/" />
        </Helmet>
      <Link to="/" aria-label="home">
        <StyledLogo>ez.</StyledLogo>
      </Link>
    </StyledHeader>
  )
}

export default Header
