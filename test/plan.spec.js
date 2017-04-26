'use strict'

const Plan = require('./plan')

describe('plan', () => {
  it('should wait for 5', (done) => {
    var plan = new Plan(5, done)

    for( var x = 1; x < 6; x++ ){
      setTimeout(()=>{
        plan.ok(1)
      }, x * 100)
    }
  })
})
