#include <mongoc/mongoc.h>
#include <bson/bson.h>
#include <stdio.h>
#include <unistd.h>

int main() {
    // Initialize libmongoc
    mongoc_init();

    // Create a client instance
    const char *uri_string = "mongodb://localhost:27017";
    mongoc_uri_t *uri = mongoc_uri_new_with_error(uri_string, NULL);
    
    if (!uri) {
        fprintf(stderr, "Failed to parse URI\n");
        return 1;
    }

    mongoc_client_t *client = mongoc_client_new_from_uri(uri);
    if (!client) {
        fprintf(stderr, "Failed to create client\n");
        mongoc_uri_destroy(uri);
        return 1;
    }

    // Get a handle on the database "test_db"
    mongoc_database_t *database = mongoc_client_get_database(client, "test_db");
    
    // Get a handle on the collection "test_collection"
    mongoc_collection_t *collection = mongoc_client_get_collection(
        client, "test_db", "test_collection");

    // Create a document to insert
    bson_t *document = bson_new();
    BSON_APPEND_UTF8(document, "name", "Raspberry Pi Test");
    BSON_APPEND_INT32(document, "value", 42);

    // Insert the document
    bson_error_t error;
    if (!mongoc_collection_insert_one(collection, document, NULL, NULL, &error)) {
        fprintf(stderr, "Insert failed: %s\n", error.message);
    } else {
        printf("Document inserted successfully\n");
    }

    // Wait for 5 seconds
    printf("Connected to MongoDB. Waiting for 5 seconds...\n");
    sleep(5);
    printf("Disconnecting...\n");

    // Clean up resources
    bson_destroy(document);
    mongoc_collection_destroy(collection);
    mongoc_database_destroy(database);
    mongoc_client_destroy(client);
    mongoc_uri_destroy(uri);
    mongoc_cleanup();

    return 0;
}
