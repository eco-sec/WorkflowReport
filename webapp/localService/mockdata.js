sap.ui.define([], function () {
	"use strict";

	return {
		// Mock current user data
		currentUser: {
			name: "107119",  // Badge number as name (used in controller)
			firstName: "Ahmed",
			lastName: "Hassan",
			email: "ahmed.hassan@example.com",
			displayName: "Ahmed Hassan",
			badgeNo: "107119"
		},

		// Mock employee data
		employees: {
			"107119": {
				employeeId: "107119",
				badgeNo: "107119",
				firstName: "Ahmed",
				lastName: "Hassan",
				email: "ahmed.hassan@example.com",
				department: "IT Department",
				position: "Senior Manager",
				isManager: true
			},
			"107120": {
				employeeId: "107120",
				badgeNo: "107120",
				firstName: "Sara",
				lastName: "Mohammed",
				email: "sara.mohammed@example.com",
				department: "IT Department",
				position: "Developer"
			},
			"107121": {
				employeeId: "107121",
				badgeNo: "107121",
				firstName: "Omar",
				lastName: "Ali",
				email: "omar.ali@example.com",
				department: "HR Department",
				position: "HR Specialist"
			}
		},

		// Mock subordinates for manager (in the format expected by the controller)
		// Simulating large dataset (100+ employees) to test Value Help search
		subordinates: {
			EmployeeHierarchySet: {
				EmployeeHierarchy: (function() {
					var employees = [];
					var firstNames = ["Ahmed", "Sara", "Omar", "Fatima", "Mohammed", "Layla", "Khalid", "Amira", "Ali", "Noor",
									  "Hassan", "Yasmin", "Tariq", "Mariam", "Zaid", "Huda", "Rashid", "Salma", "Faisal", "Dina"];
					var lastNames = ["Hassan", "Mohammed", "Ali", "Abdullah", "Salem", "Ibrahim", "Mansour", "Khalil", "Rashid", "Nasser",
									 "Ahmad", "Saeed", "Mahmoud", "Karim", "Youssef", "Hamza", "Mustafa", "Farid", "Jamal", "Aziz"];

					// Generate 50 mock subordinates
					for (var i = 0; i < 50; i++) {
						var empId = String(107120 + i);
						var firstName = firstNames[i % firstNames.length];
						var lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
						var fullName = firstName + " " + lastName;
						var email = firstName.toLowerCase() + "." + lastName.toLowerCase() + "@example.com";

						employees.push({
							EmpPernr: empId,
							EmpEnglishName: fullName,
							EmpEmailId: email,
							employeeId: empId,
							badgeNo: empId,
							firstName: firstName,
							lastName: lastName,
							fullName: fullName,
							name: fullName,
							email: email
						});
					}

					return employees;
				})()
			}
		},

		// Mock workflow report data with various statuses
		workflowReport: {
			d: {
				results: [
					{
						REQUEST_ID: "WF001",
						EMPLOYEE_ID: "107120",
						EMPLOYEE_NAME: "Sara Mohammed",
						WORKFLOW_TYPE: "Training Request",
						WORKFLOW_STATUS: "Pending",
						CLASS_ID: "CL001",
						CLASS_TITLE: "SAP ABAP Programming Fundamentals",
						CLASS_START_DATE: "/Date(1735689600000)/", // 2025-01-01
						CLASS_END_DATE: "/Date(1735862400000)/", // 2025-01-03
						CREATED_DATE: "/Date(1733097600000)/", // 2024-12-02
						SUBMITTED_DATE: "/Date(1733097600000)/",
						APPROVED_DATE: null,
						APPROVED_BY: "",
						MANAGER_ID: "107119",
						MANAGER_NAME: "Ahmed Hassan",
						COST_CENTER: "CC-001",
						DEPARTMENT: "IT Department",
						TRAINING_PROVIDER: "SAP Learning Hub",
						LOCATION: "Riyadh",
						PRIORITY: "High",
						COMMENTS: "Required for project work"
					},
					{
						REQUEST_ID: "WF002",
						EMPLOYEE_ID: "107121",
						EMPLOYEE_NAME: "Omar Ali",
						WORKFLOW_TYPE: "Training Request",
						WORKFLOW_STATUS: "Approved",
						CLASS_ID: "CL002",
						CLASS_TITLE: "SAP Fiori Development",
						CLASS_START_DATE: "/Date(1736294400000)/", // 2025-01-08
						CLASS_END_DATE: "/Date(1736467200000)/", // 2025-01-10
						CREATED_DATE: "/Date(1732492800000)/", // 2024-11-25
						SUBMITTED_DATE: "/Date(1732492800000)/",
						APPROVED_DATE: "/Date(1732579200000)/", // 2024-11-26
						APPROVED_BY: "Ahmed Hassan",
						MANAGER_ID: "107119",
						MANAGER_NAME: "Ahmed Hassan",
						COST_CENTER: "CC-002",
						DEPARTMENT: "HR Department",
						TRAINING_PROVIDER: "SAP Education",
						LOCATION: "Jeddah",
						PRIORITY: "Medium",
						COMMENTS: "Career development course"
					},
					{
						REQUEST_ID: "WF003",
						EMPLOYEE_ID: "107122",
						EMPLOYEE_NAME: "Fatima Abdullah",
						WORKFLOW_TYPE: "Training Request",
						WORKFLOW_STATUS: "Rejected",
						CLASS_ID: "CL003",
						CLASS_TITLE: "Cloud Platform Integration",
						CLASS_START_DATE: "/Date(1736899200000)/", // 2025-01-15
						CLASS_END_DATE: "/Date(1737072000000)/", // 2025-01-17
						CREATED_DATE: "/Date(1731888000000)/", // 2024-11-18
						SUBMITTED_DATE: "/Date(1731888000000)/",
						APPROVED_DATE: "/Date(1731974400000)/", // 2024-11-19
						APPROVED_BY: "Ahmed Hassan",
						MANAGER_ID: "107119",
						MANAGER_NAME: "Ahmed Hassan",
						COST_CENTER: "CC-001",
						DEPARTMENT: "IT Department",
						TRAINING_PROVIDER: "SAP Training Center",
						LOCATION: "Dammam",
						PRIORITY: "Low",
						COMMENTS: "Budget constraints"
					},
					{
						REQUEST_ID: "WF004",
						EMPLOYEE_ID: "107123",
						EMPLOYEE_NAME: "Mohammed Salem",
						WORKFLOW_TYPE: "Training Request",
						WORKFLOW_STATUS: "Completed",
						CLASS_ID: "CL004",
						CLASS_TITLE: "SAP S/4HANA Overview",
						CLASS_START_DATE: "/Date(1733097600000)/", // 2024-12-02
						CLASS_END_DATE: "/Date(1733270400000)/", // 2024-12-04
						CREATED_DATE: "/Date(1730678400000)/", // 2024-11-04
						SUBMITTED_DATE: "/Date(1730678400000)/",
						APPROVED_DATE: "/Date(1730764800000)/", // 2024-11-05
						APPROVED_BY: "Ahmed Hassan",
						MANAGER_ID: "107119",
						MANAGER_NAME: "Ahmed Hassan",
						COST_CENTER: "CC-003",
						DEPARTMENT: "Finance Department",
						TRAINING_PROVIDER: "SAP Arabia",
						LOCATION: "Riyadh",
						PRIORITY: "High",
						COMMENTS: "Successfully completed with certification"
					},
					{
						REQUEST_ID: "WF005",
						EMPLOYEE_ID: "107124",
						EMPLOYEE_NAME: "Layla Ibrahim",
						WORKFLOW_TYPE: "Training Request",
						WORKFLOW_STATUS: "In Progress",
						CLASS_ID: "CL005",
						CLASS_TITLE: "Business Intelligence with SAP Analytics Cloud",
						CLASS_START_DATE: "/Date(1737504000000)/", // 2025-01-22
						CLASS_END_DATE: "/Date(1737676800000)/", // 2025-01-24
						CREATED_DATE: "/Date(1732838400000)/", // 2024-11-29
						SUBMITTED_DATE: "/Date(1732838400000)/",
						APPROVED_DATE: "/Date(1732924800000)/", // 2024-11-30
						APPROVED_BY: "Ahmed Hassan",
						MANAGER_ID: "107119",
						MANAGER_NAME: "Ahmed Hassan",
						COST_CENTER: "CC-004",
						DEPARTMENT: "Analytics Department",
						TRAINING_PROVIDER: "SAP Learning Center",
						LOCATION: "Online",
						PRIORITY: "High",
						COMMENTS: "Currently attending"
					},
					{
						REQUEST_ID: "WF006",
						EMPLOYEE_ID: "107125",
						EMPLOYEE_NAME: "Khalid Mansour",
						WORKFLOW_TYPE: "Training Request",
						WORKFLOW_STATUS: "Cancelled",
						CLASS_ID: "CL006",
						CLASS_TITLE: "SAP HANA Database Administration",
						CLASS_START_DATE: "/Date(1738108800000)/", // 2025-01-29
						CLASS_END_DATE: "/Date(1738281600000)/", // 2025-01-31
						CREATED_DATE: "/Date(1733184000000)/", // 2024-12-03
						SUBMITTED_DATE: "/Date(1733184000000)/",
						APPROVED_DATE: null,
						APPROVED_BY: "",
						MANAGER_ID: "107119",
						MANAGER_NAME: "Ahmed Hassan",
						COST_CENTER: "CC-005",
						DEPARTMENT: "Database Team",
						TRAINING_PROVIDER: "SAP Training Hub",
						LOCATION: "Riyadh",
						PRIORITY: "Medium",
						COMMENTS: "Cancelled due to resource unavailability"
					}
				]
			}
		},

		// Mock workflow details for individual request
		workflowDetails: {
			d: {
				REQUEST_ID: "WF001",
				EMPLOYEE_ID: "107120",
				EMPLOYEE_NAME: "Sara Mohammed",
				WORKFLOW_TYPE: "Training Request",
				WORKFLOW_STATUS: "Pending",
				CLASS_ID: "CL001",
				CLASS_TITLE: "SAP ABAP Programming Fundamentals",
				CLASS_START_DATE: "/Date(1735689600000)/",
				CLASS_END_DATE: "/Date(1735862400000)/",
				CREATED_DATE: "/Date(1733097600000)/",
				SUBMITTED_DATE: "/Date(1733097600000)/",
				APPROVED_DATE: null,
				APPROVED_BY: "",
				MANAGER_ID: "107119",
				MANAGER_NAME: "Ahmed Hassan",
				COST_CENTER: "CC-001",
				DEPARTMENT: "IT Department",
				TRAINING_PROVIDER: "SAP Learning Hub",
				LOCATION: "Riyadh",
				PRIORITY: "High",
				COMMENTS: "Required for project work",
				TRAINING_COST: "5000 SAR",
				TRAINING_DURATION: "3 days",
				CERTIFICATION: "Yes",
				PREREQUISITES: "Basic programming knowledge",
				LEARNING_OBJECTIVES: "Master ABAP programming fundamentals and syntax"
			}
		},

		// Mock picklist data
		picklists: {
			workflowStatuses: [
				{ key: "Pending", text: "Pending", textAr: "قيد الانتظار" },
				{ key: "Approved", text: "Approved", textAr: "موافق عليه" },
				{ key: "Rejected", text: "Rejected", textAr: "مرفوض" },
				{ key: "Completed", text: "Completed", textAr: "مكتمل" },
				{ key: "In Progress", text: "In Progress", textAr: "قيد التنفيذ" },
				{ key: "Cancelled", text: "Cancelled", textAr: "ملغى" }
			],
			priorities: [
				{ key: "High", text: "High", textAr: "عالي" },
				{ key: "Medium", text: "Medium", textAr: "متوسط" },
				{ key: "Low", text: "Low", textAr: "منخفض" }
			],
			departments: [
				{ key: "IT Department", text: "IT Department", textAr: "قسم تقنية المعلومات" },
				{ key: "HR Department", text: "HR Department", textAr: "قسم الموارد البشرية" },
				{ key: "Finance Department", text: "Finance Department", textAr: "قسم المالية" },
				{ key: "Analytics Department", text: "Analytics Department", textAr: "قسم التحليلات" },
				{ key: "Database Team", text: "Database Team", textAr: "فريق قواعد البيانات" }
			]
		},

		// Mock approval response
		approvalResponse: {
			success: true,
			message: "Workflow approved successfully",
			workflowId: "WF" + Date.now(),
			status: "Approved"
		},

		// Mock rejection response
		rejectionResponse: {
			success: true,
			message: "Workflow rejected successfully",
			workflowId: "WF" + Date.now(),
			status: "Rejected"
		}
	};
});
