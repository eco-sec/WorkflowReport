-- Update WORKFLOW_LOG_REQUEST for instance 528cc426-4a5b-4772-bf49-fdc19c142d69
-- Modify the SET values as needed before executing

UPDATE "BTP_LMS_SCHEMA"."LMS_PROJECT.model::Tables.WORKFLOW_LOG_REQUEST"
SET
    "STATUS" = '',
    "ATTENDANCE_REQUEST_ERROR" = ''
WHERE "WORKFLOW_INSTANCE_ID" = '528cc426-4a5b-4772-bf49-fdc19c142d69';
