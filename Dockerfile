FROM python:3.12

WORKDIR /code
COPY pyproject.toml /code/pyproject.toml
COPY README.md /code/README.md

COPY ./app /code/app
COPY ./model /code/model

RUN pip install --no-cache-dir poetry
RUN poetry install 
RUN pip install python-multipart
RUN pip install python-dotenv


EXPOSE 8000

CMD ["poetry", "run", "start"]
