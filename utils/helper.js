'use strict';
const sqlConnection = require("../config/sqlConnection");

const insertQuery = (table, columns) => {
    if (!table || !columns || !columns.length) return new Error('Invalid query parameters');

    const columnsClause = columns.map(column => `${column}`).join(', ');
    const valuesClause = columns.map(column => '?').join(', ');

    const insertQuery = `INSERT INTO ${table} (${columnsClause}) VALUES (${valuesClause})`;

    return insertQuery;
};

const selectQuery = (selection, table, reference = '') => {
    if (!selection || !table) return new Error('Invalid query parameters');

    const selectQuery = reference === ''
        ? `SELECT ${selection} FROM ${table}`
        : `SELECT ${selection} FROM ${table} WHERE ${reference} = ?`;

    return selectQuery;
};

const updateQuery = (table, columns, reference) => {
    if (!table || !columns || !columns.length || !reference) return new Error('Invalid query parameters');

    const setClause = columns.map(column => `${column} = ?`).join(', ');

    const updateQuery = `UPDATE ${table} SET ${setClause} WHERE ${reference} = ?`;

    return updateQuery;
};

const deleteQuery = (table, reference) => {
    if (!table || !reference) return new Error('Invalid query parameters');

    const deleteQuery = `DELETE FROM ${table} WHERE ${reference} = ?`;

    return deleteQuery;
};

const getChallengeById = async (challengeId) => {
    try {
        const [challenge] = await sqlConnection.query(`SELECT * FROM challenges WHERE id = ?`, [challengeId]);
        return challenge[0];
    } catch (error) {
        throw error;
    }
};

module.exports = {
    insertQuery,
    selectQuery,
    updateQuery,
    deleteQuery,
    getChallengeById
}