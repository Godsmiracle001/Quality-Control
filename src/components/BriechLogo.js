import React from 'react';

const BriechLogo = ({ className = '', size = 40 }) => (
  <img
    src={process.env.PUBLIC_URL + '/logo.jpg'}
    alt="Briech UAS Logo"
    className={className}
    style={{ height: size, width: 'auto', display: 'block' }}
  />
);

export default BriechLogo; 