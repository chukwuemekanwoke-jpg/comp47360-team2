# Minimal private networking so App Runner can reach RDS without exposing
# the database publicly. App Runner itself is fully managed and needs no
# subnets of its own for public traffic — only the VPC Connector (in
# compute.tf) needs subnets, to reach RDS privately.

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "tabl-${var.environment}-vpc"
    app         = "tabl"
    environment = var.environment
  }
}

# Two private subnets across two AZs — required minimum for an RDS subnet
# group, and enough for the App Runner VPC Connector.
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "tabl-${var.environment}-private-${count.index}"
    app         = "tabl"
    environment = var.environment
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "tabl-${var.environment}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

# Allows Postgres (5432) only from the App Runner VPC Connector's security
# group — not from the internet, not from the whole VPC CIDR.
resource "aws_security_group" "rds" {
  name        = "tabl-${var.environment}-rds-sg"
  description = "Allow Postgres from the App Runner VPC connector only"
  vpc_id      = aws_vpc.main.id

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "aws_security_group" "apprunner_connector" {
  name        = "tabl-${var.environment}-apprunner-connector-sg"
  description = "Security group for the App Runner VPC connector"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound (needed to reach RDS + AWS APIs)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    app         = "tabl"
    environment = var.environment
  }
}

resource "aws_security_group_rule" "rds_from_apprunner" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.apprunner_connector.id
}
