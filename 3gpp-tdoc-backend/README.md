3gpp-tdoc-backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── documents.py
│   │       ├── imports.py
│   │       └── health.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── models/
│   │   ├── document.py
│   │   └── import_job.py
│   ├── schemas/
│   │   ├── document.py
│   │   └── import_job.py
│   ├── services/
│   │   ├── excel_importer.py
│   │   ├── classifier.py
│   │   └── hyperlink_extractor.py
│   ├── utils/
│   │   └── datetime_utils.py
│   └── main.py
├── alembic/
├── tests/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
└── README.md