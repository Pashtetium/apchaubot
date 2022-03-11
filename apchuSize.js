export const getApchuSize = () => {
  const apchuArray = Array.from({ length: 10 }, (value) => value = getRandomInt())

  apchuArray.sort((a, b) => a - b)

  if (apchuArray[1] === apchuArray[3]) {
    return apchuArray[getRandomInt(6, 9)]
  } 

  return apchuArray[getRandomInt(0, 6)]
}

const getRandomInt = (min = 3, max = 30) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; 
}