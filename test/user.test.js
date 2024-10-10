process['env']['NODE_ENV'] = process['env']['NODE_ENV'] || 'development';
require('dotenv').config();

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server'); // Assuming your Express app is located in app.js
const Helper = require('./user.helper.test')

chai.use(chaiHttp);
const expect = chai.expect;



describe('User', () => {


    this.admin = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGJhNWM5NTFlNWFjMzYzZDAzZDViYTkiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2OTUwMzUwMzgsImV4cCI6MTY5NTE0MzAzOH0.-iDRZAZyQWCt5GXPx3T6so23Ejf9Lz1sqK4QWt5gIJc'
    this.user = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTA5NDFlNThiM2JhNjY0MTAzYTE1ZDMiLCJyb2xlIjoidXNlciIsImlhdCI6MTY5NTEwNTk2NywiZXhwIjoxNjk1MjEzOTY3fQ.wVydrlVKtqyv1XPmXcLacoPvho0Ot6qNFGhojb98Y3I'

    it('Admin: should  get all users information', async (done) => {
        try {
            chai
                .request(server)
                .get('/api/user/getAllUsers')
                .set('Authorization', `Bearer ${this.admin}`)
                .send()
                .end((err, res) => {
                    if (res) {
                        expect(res['body']['body']).to.be.an('array').that.is.not.empty;
                        expect(res['body']['body']).to.have.length.greaterThan(1);
                    }
                    else {
                        console.log('errored', err);
                        throw err;
                    }
                });
            done(); // Call done() to indicate that the test has completed
        } catch (error) {
            console.log('ERROR IT', error)
        }
    })

    it('Admin: without admin should not get all users information', async (done) => {
        try {
            chai
                .request(server)
                .get('/api/user/getAllUsers')
                .send()
                .end((err, res) => {
                    expect(res).to.have.status(401);
                });
            done(); // Call done() to indicate that the test has completed
        } catch (error) {
            console.log('ERROR IT', error)
        }
    })

    it('Admin: should update User', async (done) => {
        try {
            this.userId;
            const newZip = '22222222';

            // Get One User from Database
            chai
                .request(server)
                .get('/api/user/getAllUsers')
                .set('Authorization', `Bearer ${this.admin}`)
                .send()
                .end((err, res) => {
                    if (res) {
                        this.userId = res['body']['body'][0]['_id'];
                        //  Update that User
                        chai
                            .request(server)
                            .patch(`/api/user/updateUser/${this.userId}`)
                            .set('Authorization', `Bearer ${this.admin}`)
                            .send({ 'zip': newZip })
                            .end((err, res) => {
                                expect(res['_body']['body']['zip']).equal(newZip)
                                expect(res).to.have.status(200);
                            });
                    }
                    else {
                        console.log('error ', err)
                        throw err;
                    }
                });
            done();

        } catch (error) {
            console.log('ERROR IT', error)
            throw error;
        }
    })

    it('Admin: without admin should not update User', async (done) => {
        try {
            this.userId;

            // Get One User from Database
            chai
                .request(server)
                .get('/api/user/getAllUsers')
                .set('Authorization', `Bearer ${this.admin}`)
                .send()
                .end((err, res) => {
                    this.userId = res['body']['body'][0]['_id'];
                    // Update that User
                    chai
                        .request(server)
                        .patch(`/api/user/updateUser/${this.userId}`)
                        .send({ 'zip': '22222222' })
                        .end((err, res) => {
                            if (err, res) {

                                expect(res).to.have.status(401);
                            }
                            else {
                                console.log('error', err);
                                throw err;
                            }

                        });

                });
            done();

        } catch (error) {
            console.log('ERROR IT', error)
            throw error;
        }

    })

});


