# Equivalent to google_sql_database_instance.tabl_db_staging in the GCP
# config. db-custom-2-8192 (2 vCPU / 8GB) doesn't map 1:1 to an RDS instance
# class — db.t3.medium (2 vCPU burstable / 4GB) is the closest low-cost
# equivalent for a staging-tier workload; size up if this ever needs to
# match GCP's headroom exactly.

resource "aws_db_instance" "tabl_db" {
  identifier     = "tabl-db-${var.environment}"
  engine         = "postgres"
  engine_version = "18"

  instance_class    = "db.t3.medium"
  allocated_storage = 10
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az = false # ZONAL equivalent — match GCP's availability_type

  backup_retention_period = 7
  backup_window           = "17:00-17:30" # matches GCP's 17:00 backup start_time
  maintenance_window      = "sun:00:00-sun:01:00"

  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "tabl-db-${var.environment}-final"

  tags = {
    app         = "tabl"
    environment = var.environment
  }

  lifecycle {
    # The live password is set once here and then rotated out-of-band in
    # practice — same reasoning as google_sql_user.tabl_app in the GCP
    # config. Prevents `apply` from silently resetting it later.
    ignore_changes = [password]
  }
}
