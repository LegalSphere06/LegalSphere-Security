import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopLawyers from '../components/TopLawyers'
import Banner from '../components/Banner'
import CourtsLanka from '../components/CourtsLanka'
import LawyerMenu from '../components/LawyerMenu'

const Home = () => {
  return (
    <div>
      <Header />
      <SpecialityMenu />
      <CourtsLanka />
      <TopLawyers />
      <Banner />
      <LawyerMenu />

    </div>
  )
}

export default Home
