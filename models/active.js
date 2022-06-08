/*Powered By: Manaknightdigital Inc. https://manaknightdigital.com/ Year: 2021*/
/**
 * timeout Model
 * @copyright 2021 Manaknightdigital Inc.
 * @link https://manaknightdigital.com
 * @license Proprietary Software licensing
 * @author Ryan Wong
 *
 */

// const moment = require("moment");
// const bcrypt = require("bcryptjs");
// const { Op } = require("sequelize");
const { intersection } = require("lodash");
const coreModel = require("./../core/models");

module.exports = (sequelize, DataTypes) => {
	const Timeout = sequelize.define(
		"timeout",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			message: DataTypes.STRING,
			counter: DataTypes.INTEGER,
		},
		{
			timestamps: true,
			freezeTableName: true,
			tableName: "timeout",
		},
		{
			underscoredAll: false,
			underscored: false,
		}
	);

	coreModel.call(this, Timeout);

	Timeout._preCreateProcessing = function (data) {
		return data;
	};
	Timeout._postCreateProcessing = function (data) {
		return data;
	};
	Timeout._customCountingConditions = function (data) {
		return data;
	};

	Timeout._filterAllowKeys = function (data) {
		let cleanData = {};
		let allowedFields = Timeout.allowFields();
		allowedFields.push(Timeout._primaryKey());

		for (const key in data) {
			if (allowedFields.includes(key)) {
				cleanData[key] = data[key];
			}
		}
		return cleanData;
	};

	Timeout.timeDefaultMapping = function () {
		let results = [];
		for (let i = 0; i < 24; i++) {
			for (let j = 0; j < 60; j++) {
				let hour = i < 10 ? "0".i : i;
				let min = j < 10 ? "0".j : j;
				results[i * 60 + j] = `${hour}:${min}`;
			}
		}
		return results;
	};

	Timeout.associate = function (models) {};

	Timeout.allowFields = function () {
		return ["id", "message", "counter"];
	};

	Timeout.labels = function () {
		return ["id", "message", "counter"];
	};

	Timeout.validationRules = function () {
		return [
			["id", "ID", ""],
			["message", "Message"],
			["counter", "Counter"],
		];
	};

	Timeout.validationEditRules = function () {
		return [
			["id", "ID", ""],
			["message", "Message"],
			["counter", "Counter", ""],
		];
	};

	// ex
	Timeout.intersection = function (fields) {
		if (fields) {
			return intersection(
				["id", "message", "counter", "created_at", "updated_at"],
				Object.keys(fields)
			);
		} else return [];
	};

	return Timeout;
};
