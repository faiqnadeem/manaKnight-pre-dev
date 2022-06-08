"use strict";
const axios = require("axios");

const app = require("express").Router();
// const Sequelize = require("sequelize");
// const logger = require("../../services/LoggingService");
// let pagination = require("../../services/PaginationService");
let SessionService = require("../../services/SessionService");
// let JwtService = require("../../services/JwtService");
const ValidationService = require("../../services/ValidationService");
// const PermissionService = require("../../services/PermissionService");
// const UploadService = require("../../services/UploadService");
// const AuthService = require("../../services/AuthService");
const db = require("../../models");
const helpers = require("../../core/helpers");

const role = 1;

app.get(
	"/admin/actives/:num",
	SessionService.verifySessionMiddleware(role, "admin"),
	async function (req, res, next) {
		try {
			let session = req.session;
			let paginateListViewModel = require("../../view_models/actives_admin_list_paginate_view_model");

			var viewModel = new paginateListViewModel(
				db.timeout,
				"Timeout",
				session.success,
				session.error,
				"/admin/actives"
			);

			viewModel._column = ["ID", "Message", "Counter", "Action"];
			viewModel._readable_column = ["ID", "Message", "Counter", "Action"];

			const format = req.query.format ? req.query.format : "view";
			const direction = req.query.direction ? req.query.direction : "ASC";
			const per_page = req.query.per_page ? req.query.per_page : 10;
			let order_by = req.query.order_by
				? req.query.order_by
				: viewModel.get_field_column()[0];
			let orderAssociations = [];
			viewModel.set_order_by(order_by);
			let joins = order_by.includes(".") ? order_by.split(".") : [];
			order_by = order_by.includes(".") ? joins[joins.length - 1] : order_by;
			if (joins.length > 0) {
				for (let i = joins.length - 1; i > 0; i--) {
					orderAssociations.push(`${joins[i - 1]}`);
				}
			}
			// Check for flash messages
			const flashMessageSuccess = req.flash("success");
			if (flashMessageSuccess && flashMessageSuccess.length > 0) {
				viewModel.success = flashMessageSuccess[0];
			}
			const flashMessageError = req.flash("error");
			if (flashMessageError && flashMessageError.length > 0) {
				viewModel.error = flashMessageError[0];
			}

			viewModel.set_id(req.query.id ? req.query.id : "");
			viewModel.set_name(req.query.message ? req.query.message : "");

			let where = helpers.filterEmptyFields({
				id: viewModel.get_id(),
				message: viewModel.get_name(),
			});

			const count = await db.timeout._count(where, []);

			viewModel.set_total_rows(count);
			viewModel.set_per_page(+per_page);
			viewModel.set_page(+req.params.num);
			viewModel.set_query(req.query);
			viewModel.set_sort_base_url(`/admin/actives/${+req.params.num}`);
			viewModel.set_sort(direction);

			const list = await db.timeout.getPaginated(
				viewModel.get_page() - 1 < 0 ? 0 : viewModel.get_page(),
				viewModel.get_per_page(),
				where,
				order_by,
				direction,
				orderAssociations
			);

			viewModel.set_list(list);

			if (format == "csv") {
				const csv = viewModel.to_csv();
				return res
					.set({
						"Content-Type": "text/csv",
						"Content-Disposition": 'attachment; filename="export.csv"',
					})
					.send(csv);
			}

			return res.render("admin/Actives", viewModel);
		} catch (error) {
			console.error(error);
			viewModel.error = error.message || "Something went wrong";
			return res.render("admin/Actives", viewModel);
		}
	}
);

app.post(
	"/admin/actives-edit/:id",
	SessionService.verifySessionMiddleware(role, "admin"),
	ValidationService.validateInput({ message: "required", counter: "required" }),
	async function (req, res, next) {
		let id = req.params.id;
		if (req.session.csrf === undefined) {
			req.session.csrf = SessionService.randomString(100);
		}

		const activesAdminEditViewModel = require("../../view_models/actives_admin_edit_view_model");

		const viewModel = new activesAdminEditViewModel(
			db.timeout,
			"Edit timeout",
			"",
			"",
			"/admin/actives"
		);
		viewModel.form_fields = { message: "", counter: "", id: "" };
		viewModel.output_variables = await db.output_variable.getAll();
		const { message, counter, ...rest } = req.body;

		viewModel.form_fields = {
			...viewModel.form_fields,
			message,
			counter,
		};

		try {
			if (req.validationError) {
				viewModel.error = req.validationError;
				return res.render("admin/Edit_Actives", viewModel);
			}

			const resourceExists = await db.timeout.getByPK(id);
			if (!resourceExists) {
				req.flash("error", "Timeout not found");
				return res.redirect("/admin/actives/0");
			}

			viewModel.session = req.session;

			let data = await db.timeout.edit({ message, counter }, id);
			if (!data) {
				viewModel.error = "Something went wrong";
				return res.render("admin/Edit_Actives", viewModel);
			}

			req.flash("success", "Timeout edited successfully");

			return res.redirect("/admin/actives/0");
		} catch (error) {
			console.error(error);
			viewModel.error = error.message || "Something went wrong";
			return res.render("admin/Edit_Actives", viewModel);
		}
	}
);

app.get(
	"/admin/actives-edit/:id",
	SessionService.verifySessionMiddleware(role, "admin"),
	async function (req, res, next) {
		let id = req.params.id;
		if (req.session.csrf === undefined) {
			req.session.csrf = SessionService.randomString(100);
		}
		const activesAdminEditViewModel = require("../../view_models/actives_admin_edit_view_model");

		const viewModel = new activesAdminEditViewModel(
			db.timeout,
			"Edit Timeout",
			"",
			"",
			"/admin/actives"
		);
		viewModel.output_variables = await db.output_variable.getAll();

		try {
			const exists = await db.timeout.getByPK(id);

			if (!exists) {
				req.flash("error", "Timeout not found");
				return res.redirect("/admin/actives/0");
			}
			const values = exists;
			Object.keys(viewModel.form_fields).forEach((field) => {
				viewModel.form_fields[field] = values[field] || "";
			});
			return res.render("admin/Edit_Actives", viewModel);
		} catch (error) {
			console.error(error);
			viewModel.error = error.message || "Something went wrong";
			return res.render("admin/Edit_Actives", viewModel);
		}
	}
);

// APIS
app.get("/api/v1/actives", async function (req, res, next) {
	try {
		const timeout = await db.timeout.findAll();

		const response = { actives: timeout };

		return res.status(201).json({ success: true, data: response });
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: error.message || "Something went wrong",
		});
	}
});

module.exports = app;
